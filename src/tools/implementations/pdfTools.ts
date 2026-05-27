import type { ToolOutput } from '@/types';
import { PDFDocument } from 'pdf-lib';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';

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

export async function pdfEncryptNew(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const password = (input.password as string) || '';
    const ownerPassword = (input.ownerPassword as string) || password;
    const algorithm = (input.algorithm as 'AES-256' | 'RC4') || 'AES-256';
    const allowPrint = input.allowPrint !== false;
    const allowCopy = input.allowCopy !== false;
    const allowModify = input.allowModify !== false;
    const allowAnnotate = input.allowAnnotate !== false;

    if (!file) return { success: false, error: '请选择PDF文件' };
    if (!password) return { success: false, error: '请输入密码' };

    const pdfBytes = await fileToUint8Array(file);
    const encryptedBytes = await encryptPDF(pdfBytes, password, {
      ownerPassword,
      algorithm,
      allowPrinting: allowPrint,
      allowCopying: allowCopy,
      allowModifying: allowModify,
      allowAnnotating: allowAnnotate,
    });

    const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
    const downloadUrl = downloadBlob(blob, 'encrypted.pdf');
    const originalSize = file.size;
    const newSize = blob.size;

    return {
      success: true,
      data: {
        加密算法: algorithm,
        密码: '***已设置***',
        原文件大小: `${(originalSize / 1024).toFixed(1)} KB`,
        加密后大小: `${(newSize / 1024).toFixed(1)} KB`,
        打印权限: allowPrint ? '允许' : '禁止',
        复制权限: allowCopy ? '允许' : '禁止',
        修改权限: allowModify ? '允许' : '禁止',
        注释权限: allowAnnotate ? '允许' : '禁止',
      },
      downloadUrl,
      filename: 'encrypted.pdf',
    };
  } catch (e) { return { success: false, error: `PDF加密失败: ${(e as Error).message}` }; }
}

export async function pdfDecryptNew(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const password = (input.password as string) || '';

    if (!file) return { success: false, error: '请选择PDF文件' };
    if (!password) return { success: false, error: '请输入密码' };

    const pdfBytes = await fileToUint8Array(file);
    const decryptedBytes = await decryptPDF(pdfBytes, password);

    const blob = new Blob([decryptedBytes], { type: 'application/pdf' });
    const downloadUrl = downloadBlob(blob, 'decrypted.pdf');
    const originalSize = file.size;
    const newSize = blob.size;

    return {
      success: true,
      data: {
        原文件大小: `${(originalSize / 1024).toFixed(1)} KB`,
        解密后大小: `${(newSize / 1024).toFixed(1)} KB`,
        提示: 'PDF已成功解密，移除所有密码保护',
      },
      downloadUrl,
      filename: 'decrypted.pdf',
    };
  } catch (e) { return { success: false, error: `PDF解密失败: ${(e as Error).message}` }; }
}

export async function pdfPermissionsNew(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const file = input.file as File;
    const password = (input.password as string) || 'permissions';
    const allowPrint = input.allowPrint !== false;
    const allowCopy = input.allowCopy !== false;
    const allowModify = input.allowModify !== false;
    const allowAnnotate = input.allowAnnotate !== false;
    const allowFillForms = input.allowFillForms !== false;
    const allowExtract = input.allowExtract !== false;
    const allowAssembly = input.allowAssembly !== false;
    const allowHighQualityPrint = input.allowHighQualityPrint !== false;

    if (!file) return { success: false, error: '请选择PDF文件' };

    const pdfBytes = await fileToUint8Array(file);
    const permissionBytes = await encryptPDF(pdfBytes, password, {
      allowPrinting: allowPrint,
      allowCopying: allowCopy,
      allowModifying: allowModify,
      allowAnnotating: allowAnnotate,
      allowFillingForms: allowFillForms,
      allowExtraction: allowExtract,
      allowAssembly: allowAssembly,
      allowHighQualityPrint: allowHighQualityPrint,
    });

    const blob = new Blob([permissionBytes], { type: 'application/pdf' });
    const downloadUrl = downloadBlob(blob, 'permissions.pdf');

    return {
      success: true,
      data: {
        打印权限: allowPrint ? '允许' : '禁止',
        复制权限: allowCopy ? '允许' : '禁止',
        修改权限: allowModify ? '允许' : '禁止',
        注释权限: allowAnnotate ? '允许' : '禁止',
        填写表单: allowFillForms ? '允许' : '禁止',
        内容提取: allowExtract ? '允许' : '禁止',
        页面组装: allowAssembly ? '允许' : '禁止',
        高质量打印: allowHighQualityPrint ? '允许' : '禁止',
        提示: '权限已通过加密方式写入PDF，打开时需输入密码',
      },
      downloadUrl,
      filename: 'permissions.pdf',
    };
  } catch (e) { return { success: false, error: `PDF权限设置失败: ${(e as Error).message}` }; }
}

export async function pdfToolbox(input: Record<string, unknown>): Promise<ToolOutput> {
  const mode = (input.mode as string) || '';
  switch (mode) {
    case 'split':
      return pdfSplit(input);
    case 'sign':
      return pdfSign(input);
    case 'compress':
      return pdfCompress(input);
    case 'to-word':
      return pdfToWord(input);
    case 'encrypt':
      return pdfEncryptNew(input);
    case 'decrypt':
      return pdfDecryptNew(input);
    case 'permissions':
      return pdfPermissionsNew(input);
    default:
      return { success: false, error: `未知的PDF功能模式: ${mode}，支持的模式: split, sign, compress, to-word, encrypt, decrypt, permissions` };
  }
}