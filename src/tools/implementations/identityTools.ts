import type { ToolOutput } from '@/types';

export async function idCardParser(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const idNumber = (input.idNumber as string) || '';
    if (idNumber.length !== 18) return { success: false, error: '请输入18位身份证号' };
    const province = idNumber.substring(0, 2);
    const birthDate = idNumber.substring(6, 14);
    const gender = parseInt(idNumber.substring(16, 17)) % 2 === 0 ? '女' : '男';
    const provinceMap: Record<string, string> = { '11': '北京市', '31': '上海市', '12': '天津市', '50': '重庆市', '13': '河北省', '14': '山西省', '15': '内蒙古', '21': '辽宁省', '22': '吉林省', '23': '黑龙江省', '32': '江苏省', '33': '浙江省', '34': '安徽省', '35': '福建省', '36': '江西省', '37': '山东省', '41': '河南省', '42': '湖北省', '43': '湖南省', '44': '广东省', '45': '广西', '46': '海南省', '51': '四川省', '52': '贵州省', '53': '云南省', '54': '西藏', '61': '陕西省', '62': '甘肃省', '63': '青海省', '64': '宁夏', '65': '新疆', '71': '台湾省', '81': '香港', '82': '澳门' };
    const age = new Date().getFullYear() - parseInt(birthDate.substring(0, 4));
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    let sum = 0;
    for (let i = 0; i < 17; i++) sum += parseInt(idNumber[i]) * weights[i];
    const checkCode = checkCodes[sum % 11];
    const valid = idNumber[17].toUpperCase() === checkCode;
    return {
      success: true,
      data: {
        身份证号: idNumber.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2'),
        发证地区: provinceMap[province] || '未知',
        出生日期: `${birthDate.substring(0, 4)}-${birthDate.substring(4, 6)}-${birthDate.substring(6, 8)}`,
        年龄: `${age} 岁`,
        性别: gender,
        校验结果: valid ? '有效' : '无效（校验位不匹配）',
        提示: '数据仅做格式校验，不存储任何身份信息',
      },
    };
  } catch (e) { return { success: false, error: `解析失败: ${(e as Error).message}` }; }
}

export async function numberToChinese(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const num = (input.num as string) || '';
    const mode = (input.mode as string) || 'lower';
    if (!num || isNaN(Number(num))) return { success: false, error: '请输入有效数字' };
    const cnumLower = '零一二三四五六七八九';
    const cnumUpper = '零壹贰叁肆伍陆柒捌玖';
    const units = ['', '十', '百', '千', '万', '十', '百', '千', '亿', '十', '百', '千', '兆'];
    const unitsUpper = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿', '拾', '佰', '仟', '兆'];
    const numStr = Math.abs(parseInt(num)).toString();
    const cnum = mode === 'lower' ? cnumLower : cnumUpper;
    const unitArr = mode === 'lower' ? units : unitsUpper;
    const hasDecimal = num.includes('.');
    const decimalPart = hasDecimal ? num.split('.')[1] : '';
    if (numStr === '0' && !(hasDecimal && decimalPart.length > 0)) return { success: true, data: { 原文: num, 结果: cnum[0] } };
    let result = '';
    let zeroFlag = false;
    for (let i = 0; i < numStr.length; i++) {
      const digit = parseInt(numStr[i]);
      const pos = numStr.length - 1 - i;
      if (digit === 0) { zeroFlag = true; if (pos % 4 === 0 && !result.endsWith('亿') && !result.endsWith('万')) result += unitArr[pos]; continue; }
      if (zeroFlag) { result += cnum[0]; zeroFlag = false; }
      result += cnum[digit] + unitArr[pos];
    }
    if (result.startsWith('一十')) result = result.substring(1);
    if (parseFloat(num) < 0) result = '负' + result;
    if (numStr === '0' && hasDecimal) result = cnum[0];
    if (hasDecimal) {
      result += '点';
      for (const d of decimalPart) result += cnum[parseInt(d)];
    }
    return { success: true, data: { 原文: num, 结果: result, 格式: mode === 'lower' ? '小写数字' : '大写金额' } };
  } catch (e) { return { success: false, error: `转换失败: ${(e as Error).message}` }; }
}