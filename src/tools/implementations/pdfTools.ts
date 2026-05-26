import type { ToolOutput } from '@/types';
import { PDFDocument, StandardFonts, rgb, PDFName, PDFCheckBox } from 'pdf-lib';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

function downloadBlob(blob: Blob, filename: string): string {
  const url = URL.createObjectURL(blob);
  return url;
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function fileToUint8Array(file: File): Promise<Uint8Array> {
  const ab = await fileToArrayBuffer(file);
  return new Uint8Array(ab);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function pdfSplit(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const pagesStr = (input.pages as string) || '';
    if (!file) return { success: false, error: '请选择PDF文件' };
    if (!file.name.toLowerCase().endsWith('.pdf')) return { success: false, error: '仅支持PDF文件' };

    const pdfBytes = await fileToUint8Array(file);
    const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    const pagesToExtract: number[] = [];
    if (!pagesStr.trim()) {
      pagesToExtract.push(0);
    } else {
      const parts = pagesStr.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [s, e] = trimmed.split('-').map(Number);
          for (let i = Math.max(1, s); i <= Math.min(totalPages, e); i++) {
            pagesToExtract.push(i - 1);
          }
        } else {
          const n = parseInt(trimmed, 10);
          if (n >= 1 && n <= totalPages) pagesToExtract.push(n - 1);
        }
      }
    }

    if (pagesToExtract.length === 0) return { success: false, error: '未找到有效页码范围' };

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, pagesToExtract);
    copiedPages.forEach(p => newDoc.addPage(p));

    const resultBytes = await newDoc.save();
    const blob = new Blob([resultBytes], { type: 'application/pdf' });
    const downloadUrl = downloadBlob(blob, 'split.pdf');

    return {
      success: true,
      data: {
        原始页数: `${totalPages} 页`,
        提取页数: `${pagesToExtract.length} 页`,
        页码范围: pagesToExtract.map(i => `第${i + 1}页`).join('、'),
      },
      downloadUrl,
      filename: 'split.pdf',
    };
  } catch (e) { return { success: false, error: `PDF拆分失败: ${(e as Error).message}` }; }
}

export async function pdfSign(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const signFile = input.signFile as File;
    const pageNum = Number(input.pageNum || 1);
    const x = Number(input.x ?? 50);
    const y = Number(input.y ?? 50);
    const scale = Number(input.scale ?? 0.3);

    if (!file) return { success: false, error: '请选择PDF文件' };
    if (!signFile) return { success: false, error: '请选择签名图片' };

    const pdfBytes = await fileToUint8Array(file);
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const targetPage = pageNum - 1;
    if (targetPage < 0 || targetPage >= doc.getPageCount()) {
      return { success: false, error: `页码超出范围，PDF共 ${doc.getPageCount()} 页` };
    }

    let signImage;
    const signBuffer = await fileToArrayBuffer(signFile);
    const signType = signFile.type;

    if (signType === 'image/png') {
      signImage = await doc.embedPng(new Uint8Array(signBuffer));
    } else if (signType === 'image/jpeg' || signType === 'image/jpg') {
      signImage = await doc.embedJpg(new Uint8Array(signBuffer));
    } else {
      return { success: false, error: '签名图片仅支持PNG和JPEG格式' };
    }

    const page = doc.getPage(targetPage);
    const { width: pageW, height: pageH } = page.getSize();
    const imgW = signImage.width * scale;
    const imgH = signImage.height * scale;

    const signX = Math.max(0, Math.min(pageW - imgW, Number(x)));
    const signY = Math.max(0, Math.min(pageH - imgH, Number(y)));

    page.drawImage(signImage, { x: signX, y: signY, width: imgW, height: imgH, opacity: 0.9 });

    const resultBytes = await doc.save();
    const blob = new Blob([resultBytes], { type: 'application/pdf' });
    const downloadUrl = downloadBlob(blob, 'signed.pdf');

    return {
      success: true,
      data: {
        签名位置: `第${pageNum}页 (${Math.round(signX)}, ${Math.round(signY)})`,
        签名大小: `${Math.round(imgW)}×${Math.round(imgH)}`,
      },
      downloadUrl,
      filename: 'signed.pdf',
    };
  } catch (e) { return { success: false, error: `PDF签名失败: ${(e as Error).message}` }; }
}

export async function pdfCompress(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    if (!file) return { success: false, error: '请选择PDF文件' };

    const originalSize = file.size;
    const pdfBytes = await fileToUint8Array(file);
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const resultBytes = await doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100,
    });

    const blob = new Blob([resultBytes], { type: 'application/pdf' });
    const downloadUrl = downloadBlob(blob, 'compressed.pdf');
    const compressedSize = blob.size;
    const ratio = originalSize > 0 ? ((1 - compressedSize / originalSize) * 100).toFixed(1) : '0';

    return {
      success: true,
      data: {
        原始大小: `${(originalSize / 1024).toFixed(1)} KB`,
        压缩后: `${(compressedSize / 1024).toFixed(1)} KB`,
        压缩率: `${ratio}%`,
        提示: '压缩效果取决于PDF内容，扫描版PDF效果有限',
      },
      downloadUrl,
      filename: 'compressed.pdf',
    };
  } catch (e) { return { success: false, error: `PDF压缩失败: ${(e as Error).message}` }; }
}

export async function pdfEncrypt(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const password = (input.password as string) || '';
    if (!file) return { success: false, error: '请选择PDF文件' };
    if (!password || password.length < 4) return { success: false, error: '密码至少4位' };

    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return { success: false, error: '请选择PDF文件' };
    }

    // 检查文件大小（限制50MB）
    if (file.size > 50 * 1024 * 1024) {
      return { success: false, error: 'PDF文件过大，请选择小于50MB的文件' };
    }

    const pdfBytes = await fileToUint8Array(file);
    
    // 验证PDF文件头
    const header = new TextDecoder().decode(pdfBytes.slice(0, 5));
    if (header !== '%PDF-') {
      return { success: false, error: '文件不是有效的PDF格式' };
    }

    let doc: PDFDocument;
    try {
      // 尝试加载PDF，忽略可能的加密
      doc = await PDFDocument.load(pdfBytes, { 
        ignoreEncryption: true,
        updateMetadata: false,
      });
    } catch (loadError) {
      const errMsg = (loadError as Error).message;
      if (errMsg.includes('encrypted') || errMsg.includes('password')) {
        return { success: false, error: '该PDF已被加密，请先解密后再重新加密' };
      }
      if (errMsg.includes('Invalid PDF')) {
        return { success: false, error: 'PDF文件格式无效或已损坏，请检查文件' };
      }
      return { success: false, error: `PDF加载失败: ${errMsg}` };
    }

    // 检查PDF是否已经有内容
    const pageCount = doc.getPageCount();
    if (pageCount === 0) {
      return { success: false, error: 'PDF文件没有页面内容' };
    }

    // 设置加密并保存
    let resultBytes: Uint8Array;
    try {
      // pdf-lib 1.17.1 使用 save 时传入加密参数，而不是单独的 encrypt 方法
      resultBytes = await doc.save({
        encrypt: {
          userPassword: password,
          ownerPassword: password + '_owner_' + Date.now(),
          permissions: {
            printing: 'highResolution',
            modifying: false,
            copying: false,
            annotating: true,
            fillingForms: true,
            contentAccessibility: true,
            documentAssembly: false,
          },
        },
      } as any);
    } catch (encryptError) {
      const errMsg = (encryptError as Error).message;
      if (errMsg.includes('encrypt') || errMsg.includes('Encrypt')) {
        return {
          success: false,
          error: '当前浏览器环境暂不支持PDF加密，请尝试使用Chrome或Edge浏览器',
        };
      }
      return { success: false, error: `PDF加密失败: ${errMsg}` };
    }

    const blob = new Blob([resultBytes], { type: 'application/pdf' });
    const downloadUrl = downloadBlob(blob, 'encrypted.pdf');

    return {
      success: true,
      data: {
        状态: '✅ 已加密',
        页数: `${pageCount} 页`,
        密码: password,
        权限设置: '禁止修改、禁止复制、允许打印、允许填写表单',
        提示: '请妥善保管密码，丢失后无法恢复',
      },
      downloadUrl,
      filename: 'encrypted.pdf',
    };
  } catch (e) { 
    return { success: false, error: `PDF加密失败: ${(e as Error).message}` }; 
  }
}

export async function pdfDecrypt(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const password = (input.password as string) || '';
    if (!file) return { success: false, error: '请选择PDF文件' };
    if (!password) return { success: false, error: '请输入PDF密码' };

    const pdfBytes = await fileToUint8Array(file);
    let doc: PDFDocument;

    try {
      doc = await PDFDocument.load(pdfBytes, { password } as any);
    } catch (e) {
      return { success: false, error: '密码错误或PDF文件损坏，请重试' };
    }

    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('pdf-lib');
    doc.setCreator('pdf-lib');

    const resultBytes = await doc.save({ useObjectStreams: true });
    const blob = new Blob([resultBytes], { type: 'application/pdf' });
    const downloadUrl = downloadBlob(blob, 'decrypted.pdf');

    return {
      success: true,
      data: {
        状态: '已解密',
        原始大小: `${(file.size / 1024).toFixed(1)} KB`,
        提示: '解密后请保存文件，原加密文件不会自动删除',
      },
      downloadUrl,
      filename: 'decrypted.pdf',
    };
  } catch (e) { return { success: false, error: `PDF解密失败: ${(e as Error).message}` }; }
}

export async function pdfPermissions(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const password = (input.password as string) || '';
    const allowPrint = input.allowPrint !== false;
    const allowCopy = input.allowCopy !== false;
    const allowModify = input.allowModify !== false;
    const allowAnnotate = input.allowAnnotate !== false;

    if (!file) return { success: false, error: '请选择PDF文件' };
    if (!password || password.length < 4) return { success: false, error: '请设置权限密码（至少4位）' };

    const pdfBytes = await fileToUint8Array(file);
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const resultBytes = await (doc as any).save({
      encrypt: {
        userPassword: password,
        ownerPassword: password + '_admin',
        permissions: {
          printing: allowPrint ? 'highResolution' : 'none',
          modifying: allowModify,
          copying: allowCopy,
          annotating: allowAnnotate,
          fillingForms: allowModify,
          contentAccessibility: allowCopy,
          documentAssembly: allowModify,
        },
      },
    });
    const blob = new Blob([resultBytes], { type: 'application/pdf' });
    const downloadUrl = downloadBlob(blob, 'protected.pdf');

    const perms: string[] = [];
    if (allowPrint) perms.push('允许打印');
    else perms.push('禁止打印');
    if (allowCopy) perms.push('允许复制');
    else perms.push('禁止复制');
    if (allowModify) perms.push('允许修改');
    else perms.push('禁止修改');
    if (allowAnnotate) perms.push('允许批注');
    else perms.push('禁止批注');

    return {
      success: true,
      data: {
        权限密码: password,
        权限设置: perms.join('、'),
        提示: '请妥善保管密码，忘记后无法恢复修改权限',
      },
      downloadUrl,
      filename: 'protected.pdf',
    };
  } catch (e) { return { success: false, error: `权限设置失败: ${(e as Error).message}` }; }
}

export async function imageTableToExcel(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    if (!file) return { success: false, error: '请选择包含表格的图片' };
    if (!file.type.startsWith('image/')) return { success: false, error: '仅支持图片文件' };

    const meta = input.saveType as string || 'xlsx';

    const tesseract = (await import('tesseract.js')).default;
    const XLSX = await import('xlsx');

    const imgUrl = URL.createObjectURL(file);

    const result = await tesseract.recognize(imgUrl, 'chi_sim+eng', {
      logger: () => {},
    });
    URL.revokeObjectURL(imgUrl);

    const { words } = result.data;
    if (!words || words.length === 0) {
      return { success: false, error: '未识别到任何文字，请检查图片清晰度' };
    }

    const rowTolerance = 8;
    const rows: { y: number; cells: { x: number; text: string }[] }[] = [];

    const sorted = [...words].sort((a, b) => {
      const ay = a.bbox.y0;
      const by = b.bbox.y0;
      if (Math.abs(ay - by) <= rowTolerance) {
        return a.bbox.x0 - b.bbox.x0;
      }
      return ay - by;
    });

    for (const word of sorted) {
      const wY = word.bbox.y0;
      let placed = false;
      for (const row of rows) {
        if (Math.abs(row.y - wY) <= rowTolerance) {
          row.cells.push({ x: word.bbox.x0, text: word.text });
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push({ y: wY, cells: [{ x: word.bbox.x0, text: word.text }] });
      }
    }

    rows.forEach(r => r.cells.sort((a, b) => a.x - b.x));

    const maxCols = Math.max(...rows.map(r => r.cells.length), 1);
    const tableData: string[][] = rows.map(r => {
      const row: string[] = [];
      for (let i = 0; i < maxCols; i++) {
        row.push(r.cells[i]?.text || '');
      }
      return row;
    });

    if (meta === 'csv') {
      const csvContent = tableData.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
      const downloadUrl = downloadBlob(blob, 'table.csv');
      return {
        success: true,
        data: { 行数: `${rows.length} 行`, 列数: `${maxCols} 列`, 格式: 'CSV', 提示: '表格结构为自动识别，建议下载后检查调整' },
        downloadUrl,
        filename: 'table.csv',
      };
    }

    const ws = XLSX.utils.aoa_to_sheet(tableData);
    ws['!cols'] = Array.from({ length: maxCols }, () => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '表格');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([new Uint8Array(excelBuffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const downloadUrl = downloadBlob(blob, 'table.xlsx');

    return {
      success: true,
      data: { 行数: `${rows.length} 行`, 列数: `${maxCols} 列`, 格式: 'XLSX', 提示: '表格结构为自动识别，建议下载后检查调整' },
      downloadUrl,
      filename: 'table.xlsx',
    };
  } catch (e) { return { success: false, error: `表格识别失败: ${(e as Error).message}` }; }
}

export async function pdfToWord(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    if (!file) return { success: false, error: '请选择PDF文件' };

    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
    const pdfData = await fileToUint8Array(file);
    const loadingTask = pdfjsLib.getDocument({ data: pdfData.slice() });
    const pdfDoc = await loadingTask.promise;

    const totalPages = pdfDoc.numPages;
    const textParts: string[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const pageText = (content.items as any[])
        .map((item: { str?: string }) => (item.str || ''))
        .filter((s: string) => s.trim())
        .join(' ');
      if (pageText.trim()) {
        textParts.push(`第 ${i} 页\n${pageText}`);
      }
    }

    const fullText = textParts.join('\n\n');

    if (!fullText.trim()) {
      return { success: false, error: '未能从PDF中提取到文字，该PDF可能是扫描版图片，建议使用OCR识别' };
    }

    const meta = input.saveType as string || 'docx';

    if (meta === 'txt') {
      const blob = new Blob(['\uFEFF' + fullText], { type: 'text/plain;charset=utf-8' });
      const downloadUrl = downloadBlob(blob, 'extracted.txt');
      return {
        success: true,
        data: { 页数: `${totalPages} 页`, 字数: `${fullText.length} 字符`, 格式: 'TXT' },
        downloadUrl,
        filename: 'extracted.txt',
      };
    }

    const docx = await import('docx');
    const paragraphs = fullText.split('\n').filter(Boolean).map(line => {
      if (line.startsWith('第 ') && line.includes(' 页')) {
        return new docx.Paragraph({
          children: [new docx.TextRun({ text: line, bold: true, size: 28 })],
          heading: docx.HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        });
      }
      return new docx.Paragraph({
        children: [new docx.TextRun({ text: line, size: 22 })],
        spacing: { after: 120 },
      });
    });

    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    const wordBuffer = await docx.Packer.toBlob(doc);
    const downloadUrl = downloadBlob(wordBuffer, 'extracted.docx');

    return {
      success: true,
      data: { 页数: `${totalPages} 页`, 字数: `${fullText.length} 字符`, 格式: 'DOCX (Word)' },
      downloadUrl,
      filename: 'extracted.docx',
    };
  } catch (e) { return { success: false, error: `PDF提取失败: ${(e as Error).message}` }; }
}