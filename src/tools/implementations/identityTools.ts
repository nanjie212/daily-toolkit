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

export async function phoneNumberLocator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const phone = (input.phone as string) || '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 11 || !clean.startsWith('1')) return { success: false, error: '请输入正确的11位手机号' };
    const prefix = clean.substring(0, 3);
    const prefixMap: Record<string, { carrier: string; region: string }> = {
      '130': { carrier: '中国联通', region: '全国' }, '131': { carrier: '中国联通', region: '全国' },
      '132': { carrier: '中国联通', region: '全国' }, '133': { carrier: '中国电信', region: '全国' },
      '134': { carrier: '中国移动', region: '全国' }, '135': { carrier: '中国移动', region: '全国' },
      '136': { carrier: '中国移动', region: '全国' }, '137': { carrier: '中国移动', region: '全国' },
      '138': { carrier: '中国移动', region: '全国' }, '139': { carrier: '中国移动', region: '全国' },
      '150': { carrier: '中国移动', region: '全国' }, '151': { carrier: '中国移动', region: '全国' },
      '152': { carrier: '中国移动', region: '全国' }, '153': { carrier: '中国电信', region: '全国' },
      '155': { carrier: '中国联通', region: '全国' }, '156': { carrier: '中国联通', region: '全国' },
      '157': { carrier: '中国移动', region: '全国' }, '158': { carrier: '中国移动', region: '全国' },
      '159': { carrier: '中国移动', region: '全国' }, '166': { carrier: '中国联通', region: '全国' },
      '170': { carrier: '虚拟运营商', region: '全国' }, '171': { carrier: '虚拟运营商', region: '全国' },
      '172': { carrier: '虚拟运营商', region: '全国' }, '173': { carrier: '中国电信', region: '全国' },
      '174': { carrier: '中国电信', region: '全国' }, '175': { carrier: '中国联通', region: '全国' },
      '176': { carrier: '中国联通', region: '全国' }, '177': { carrier: '中国电信', region: '全国' },
      '178': { carrier: '中国移动', region: '全国' }, '180': { carrier: '中国电信', region: '全国' },
      '181': { carrier: '中国电信', region: '全国' }, '182': { carrier: '中国移动', region: '全国' },
      '183': { carrier: '中国移动', region: '全国' }, '184': { carrier: '中国移动', region: '全国' },
      '185': { carrier: '中国联通', region: '全国' }, '186': { carrier: '中国联通', region: '全国' },
      '187': { carrier: '中国移动', region: '全国' }, '188': { carrier: '中国移动', region: '全国' },
      '189': { carrier: '中国电信', region: '全国' }, '198': { carrier: '中国移动', region: '全国' },
      '199': { carrier: '中国电信', region: '全国' },
    };
    const info = prefixMap[prefix];
    const masked = `${clean.substring(0, 3)}****${clean.substring(7)}`;
    return {
      success: true,
      data: {
        手机号: masked,
        运营商: info?.carrier || '未知',
        归属地: info?.region || '未知',
        提示: '归属地为粗略查询，携号转网用户可能不准',
      },
    };
  } catch (e) { return { success: false, error: `查询失败: ${(e as Error).message}` }; }
}

export async function bankCardValidator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const cardNum = (input.cardNum as string) || '';
    const clean = cardNum.replace(/\D/g, '');
    if (clean.length < 16 || clean.length > 19) return { success: false, error: '请输入16-19位银行卡号' };
    let sum = 0;
    let alt = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean[i]);
      if (alt) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
      alt = !alt;
    }
    const valid = sum % 10 === 0;
    const bankPrefixMap: Record<string, string> = {
      '621700': '建设银行', '622202': '工商银行', '622845': '农业银行', '621661': '中国银行',
      '622580': '招商银行', '622609': '平安银行', '622155': '邮政储蓄', '621030': '北京银行',
      '439225': '招商银行(信用卡)', '552742': '建设银行(信用卡)', '622230': '工商银行(信用卡)',
    };
    let bank = '未知';
    for (const [prefix, name] of Object.entries(bankPrefixMap)) {
      if (clean.startsWith(prefix)) { bank = name; break; }
    }
    const masked = clean.replace(/(\d{4})\d+(\d{4})/, '$1****$2');
    return {
      success: true,
      data: {
        卡号: masked,
        发卡行: bank,
        Luhn校验: valid ? '通过' : '未通过',
        提示: '仅做卡号格式校验，不验证卡内余额或有效性',
      },
    };
  } catch (e) { return { success: false, error: `校验失败: ${(e as Error).message}` }; }
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