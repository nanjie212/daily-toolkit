import QRCode from 'qrcode';
import type { ToolOutput } from '@/types';

export async function qrcodeGenerator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const content = input.content as string;
    const size = Number(input.size) || 256;
    const color = (input.color as string) || '#000000';

    if (!content?.trim()) return { success: false, error: '请输入内容' };

    const dataUrl = await QRCode.toDataURL(content, {
      width: size,
      margin: 2,
      color: {
        dark: color,
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    return {
      success: true,
      data: dataUrl,
      downloadUrl: dataUrl,
      filename: 'qrcode.png',
    };
  } catch (e) {
    return { success: false, error: `生成失败: ${(e as Error).message}` };
  }
}

const lengthConversions: Record<string, number> = {
  m: 1, km: 1000, cm: 0.01, in: 0.0254, ft: 0.3048, mi: 1609.344,
};

const weightConversions: Record<string, number> = {
  kg: 1, g: 0.001, lb: 0.453592, oz: 0.0283495,
};

function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number;
  switch (from) {
    case 'c': celsius = value; break;
    case 'f': celsius = (value - 32) * 5 / 9; break;
    case 'k': celsius = value - 273.15; break;
    default: return value;
  }
  switch (to) {
    case 'c': return celsius;
    case 'f': return celsius * 9 / 5 + 32;
    case 'k': return celsius + 273.15;
    default: return celsius;
  }
}

export async function unitConverter(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const value = Number(input.value);
    const category = (input.category as string) || 'length';
    const fromUnit = input.fromUnit as string;
    const toUnit = input.toUnit as string;

    if (isNaN(value)) return { success: false, error: '请输入有效数值' };

    let result: number;
    const unitNames: Record<string, string> = {
      m: '米', km: '千米', cm: '厘米', in: '英寸', ft: '英尺', mi: '英里',
      kg: '千克', g: '克', lb: '磅', oz: '盎司',
      c: '摄氏度', f: '华氏度', k: '开尔文',
    };

    if (category === 'temperature') {
      result = convertTemperature(value, fromUnit, toUnit);
    } else {
      const conversions = category === 'length' ? lengthConversions : weightConversions;
      const fromFactor = conversions[fromUnit];
      const toFactor = conversions[toUnit];
      if (!fromFactor || !toFactor) return { success: false, error: '不支持的单位' };
      const baseValue = value * fromFactor;
      result = baseValue / toFactor;
    }

    return {
      success: true,
      data: `${value} ${unitNames[fromUnit] || fromUnit} = ${Number(result.toFixed(6))} ${unitNames[toUnit] || toUnit}`,
    };
  } catch (e) {
    return { success: false, error: `转换失败: ${(e as Error).message}` };
  }
}

export async function mortgageCalculator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const principalWan = Number(input.principal) || 100;
    const annualRate = Number(input.rate) || 3.5;
    const years = Number(input.years) || 30;
    const method = (input.method as string) || 'equal-payment';

    const principal = principalWan * 10000;
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = years * 12;

    if (method === 'equal-payment') {
      const monthly = principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
      const totalPayment = monthly * totalMonths;
      const totalInterest = totalPayment - principal;

      return {
        success: true,
        data: `【等额本息】\n贷款金额: ${principalWan}万元 (${principal.toLocaleString()}元)\n年利率: ${annualRate}%\n贷款年限: ${years}年 (${totalMonths}期)\n\n每月还款: ${monthly.toFixed(2)}元\n还款总额: ${totalPayment.toFixed(2)}元\n利息总额: ${totalInterest.toFixed(2)}元`,
      };
    } else {
      const monthlyPrincipal = principal / totalMonths;
      const firstMonthPayment = monthlyPrincipal + principal * monthlyRate;
      const lastMonthPayment = monthlyPrincipal + monthlyPrincipal * monthlyRate;
      let totalPayment = 0;
      for (let i = 1; i <= totalMonths; i++) {
        totalPayment += monthlyPrincipal + (principal - monthlyPrincipal * (i - 1)) * monthlyRate;
      }
      const totalInterest = totalPayment - principal;

      return {
        success: true,
        data: `【等额本金】\n贷款金额: ${principalWan}万元 (${principal.toLocaleString()}元)\n年利率: ${annualRate}%\n贷款年限: ${years}年 (${totalMonths}期)\n\n首月还款: ${firstMonthPayment.toFixed(2)}元\n末月还款: ${lastMonthPayment.toFixed(2)}元\n每月递减: ${monthlyPrincipal * monthlyRate < 0.01 ? monthlyPrincipal * monthlyRate : (monthlyPrincipal * monthlyRate).toFixed(2)}元\n还款总额: ${totalPayment.toFixed(2)}元\n利息总额: ${totalInterest.toFixed(2)}元`,
      };
    }
  } catch (e) {
    return { success: false, error: `计算失败: ${(e as Error).message}` };
  }
}

export async function taxCalculator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const salary = Number(input.salary) || 0;
    const socialInsurance = Number(input.socialInsurance) || 0;
    const threshold = Number(input.threshold) || 5000;
    const deductions = Number(input.deductions) || 0;

    const taxableIncome = salary - socialInsurance - threshold - deductions;

    if (taxableIncome <= 0) {
      return {
        success: true,
        data: `【个税计算结果】\n税前月薪: ${salary.toLocaleString()}元\n五险一金: ${socialInsurance.toLocaleString()}元\n起征点: ${threshold.toLocaleString()}元\n专项附加扣除: ${deductions.toLocaleString()}元\n\n应纳税所得额: 0元\n应缴个税: 0元\n到手工资: ${(salary - socialInsurance).toLocaleString()}元`,
      };
    }

    const taxBrackets = [
      { limit: 3000, rate: 0.03, deduction: 0 },
      { limit: 12000, rate: 0.10, deduction: 210 },
      { limit: 25000, rate: 0.20, deduction: 1410 },
      { limit: 35000, rate: 0.25, deduction: 2660 },
      { limit: 55000, rate: 0.30, deduction: 4410 },
      { limit: 80000, rate: 0.35, deduction: 7160 },
      { limit: Infinity, rate: 0.45, deduction: 15160 },
    ];

    let tax = 0;
    let rate = 0;
    let quickDeduction = 0;
    for (const bracket of taxBrackets) {
      if (taxableIncome <= bracket.limit) {
        rate = bracket.rate;
        quickDeduction = bracket.deduction;
        tax = taxableIncome * bracket.rate - bracket.deduction;
        break;
      }
    }

    const takeHome = salary - socialInsurance - tax;

    return {
      success: true,
      data: `【个税计算结果】\n税前月薪: ${salary.toLocaleString()}元\n五险一金: ${socialInsurance.toLocaleString()}元\n起征点: ${threshold.toLocaleString()}元\n专项附加扣除: ${deductions.toLocaleString()}元\n\n应纳税所得额: ${taxableIncome.toLocaleString()}元\n适用税率: ${(rate * 100).toFixed(0)}%\n速算扣除数: ${quickDeduction.toLocaleString()}元\n应缴个税: ${tax.toFixed(2)}元\n到手工资: ${takeHome.toFixed(2)}元`,
    };
  } catch (e) {
    return { success: false, error: `计算失败: ${(e as Error).message}` };
  }
}

export async function bmiCalculator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const weight = Number(input.weight);
    const height = Number(input.height);

    if (!weight || !height) return { success: false, error: '请输入有效的体重和身高' };

    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    let category: string;
    let advice: string;
    if (bmi < 18.5) {
      category = '偏瘦';
      advice = '建议适当增加营养摄入，均衡饮食，适度锻炼增强体质。';
    } else if (bmi < 24) {
      category = '正常';
      advice = '体重在健康范围内，请继续保持良好的生活习惯。';
    } else if (bmi < 28) {
      category = '偏胖';
      advice = '建议控制饮食，减少高热量食物摄入，增加有氧运动。';
    } else {
      category = '肥胖';
      advice = '建议咨询医生，制定科学的减重计划，注意饮食和运动。';
    }

    return {
      success: true,
      data: `【BMI计算结果】\n体重: ${weight}kg\n身高: ${height}cm\n\nBMI值: ${bmi.toFixed(1)}\n健康状态: ${category}\n\n${advice}`,
    };
  } catch (e) {
    return { success: false, error: `计算失败: ${(e as Error).message}` };
  }
}

export async function dateCalculator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const mode = (input.mode as string) || 'diff';
    const date1Str = input.date1 as string;
    const date2Str = (input.date2 as string) || '';

    if (!date1Str) return { success: false, error: '请输入日期' };

    if (mode === 'diff') {
      const d1 = new Date(date1Str);
      const d2 = new Date(date2Str);
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return { success: false, error: '日期格式无效，请使用 YYYY-MM-DD' };

      const diffMs = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);

      return {
        success: true,
        data: `【日期差计算】\n日期1: ${date1Str}\n日期2: ${date2Str}\n\n相差: ${diffDays}天 (${diffWeeks}周${diffDays % 7}天)`,
      };
    } else if (mode === 'add') {
      const d1 = new Date(date1Str);
      const days = parseInt(date2Str, 10);
      if (isNaN(d1.getTime())) return { success: false, error: '日期格式无效，请使用 YYYY-MM-DD' };
      if (isNaN(days)) return { success: false, error: '请输入有效的天数' };

      d1.setDate(d1.getDate() + days);
      const result = d1.toISOString().split('T')[0];

      return {
        success: true,
        data: `【日期推算】\n起始日期: ${date1Str}\n推算天数: ${days > 0 ? '+' : ''}${days}天\n\n结果日期: ${result}`,
      };
    } else {
      const target = new Date(date1Str);
      if (isNaN(target.getTime())) return { success: false, error: '日期格式无效，请使用 YYYY-MM-DD' };

      const now = new Date();
      const diffMs = target.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return {
          success: true,
          data: `【倒计时】\n目标日期: ${date1Str}\n\n距离目标还有: ${diffDays}天`,
        };
      } else if (diffDays === 0) {
        return {
          success: true,
          data: `【倒计时】\n目标日期: ${date1Str}\n\n就是今天！`,
        };
      } else {
        return {
          success: true,
          data: `【倒计时】\n目标日期: ${date1Str}\n\n已过去: ${Math.abs(diffDays)}天`,
        };
      }
    }
  } catch (e) {
    return { success: false, error: `计算失败: ${(e as Error).message}` };
  }
}

export async function randomDecision(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const optionsStr = input.options as string;
    const count = Number(input.count) || 1;

    if (!optionsStr?.trim()) return { success: false, error: '请输入选项' };

    const options = optionsStr.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (options.length === 0) return { success: false, error: '请输入至少一个选项' };

    const selected: string[] = [];
    const available = [...options];
    const selectCount = Math.min(count, available.length);

    for (let i = 0; i < selectCount; i++) {
      const idx = Math.floor(Math.random() * available.length);
      selected.push(available[idx]);
      available.splice(idx, 1);
    }

    return {
      success: true,
      data: `【随机决策】\n所有选项: ${options.join('、')}\n\n🎯 选中: ${selected.join('、')}`,
    };
  } catch (e) {
    return { success: false, error: `决策失败: ${(e as Error).message}` };
  }
}

export async function luckyDraw(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const namesStr = input.names as string;
    const count = Number(input.count) || 1;
    const allowRepeat = input.allowRepeat as boolean;

    if (!namesStr?.trim()) return { success: false, error: '请输入名单' };

    const names = namesStr.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (names.length === 0) return { success: false, error: '请输入至少一个名字' };

    if (!allowRepeat && count > names.length) {
      return { success: false, error: `不允许重复抽取，但名单只有${names.length}人，无法抽取${count}人` };
    }

    const drawn: string[] = [];

    if (allowRepeat) {
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * names.length);
        drawn.push(names[idx]);
      }
    } else {
      const shuffled = [...names].sort(() => Math.random() - 0.5);
      for (let i = 0; i < count; i++) {
        drawn.push(shuffled[i]);
      }
    }

    return {
      success: true,
      data: `【抽奖结果】\n参与人数: ${names.length}\n抽取人数: ${count}\n允许重复: ${allowRepeat ? '是' : '否'}\n\n🎉 中签: ${drawn.join('、')}`,
    };
  } catch (e) {
    return { success: false, error: `抽奖失败: ${(e as Error).message}` };
  }
}

export async function pomodoroTimer(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const workMinutes = Number(input.workMinutes) || 25;
    const breakMinutes = Number(input.breakMinutes) || 5;
    const rounds = Number(input.rounds) || 4;

    const totalMinutes = (workMinutes + breakMinutes) * rounds - breakMinutes;

    const lines: string[] = [];
    lines.push(`【番茄钟计划】`);
    lines.push(`工作时长: ${workMinutes}分钟`);
    lines.push(`休息时长: ${breakMinutes}分钟`);
    lines.push(`轮数: ${rounds}轮`);
    lines.push(`总时长: ${totalMinutes}分钟 (${Math.floor(totalMinutes / 60)}小时${totalMinutes % 60}分钟)`);
    lines.push('');

    for (let i = 1; i <= rounds; i++) {
      lines.push(`🍅 第${i}轮: 工作 ${workMinutes}分钟`);
      if (i < rounds) {
        lines.push(`☕ 休息 ${breakMinutes}分钟`);
      }
    }

    return {
      success: true,
      data: lines.join('\n'),
    };
  } catch (e) {
    return { success: false, error: `设置失败: ${(e as Error).message}` };
  }
}

export async function timezoneConverter(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const datetimeStr = input.datetime as string;
    const fromTz = (input.fromTimezone as string) || 'Asia/Shanghai';
    const toTz = (input.toTimezone as string) || 'America/New_York';

    if (!datetimeStr?.trim()) return { success: false, error: '请输入时间' };

    const date = new Date(datetimeStr);
    if (isNaN(date.getTime())) return { success: false, error: '时间格式无效，请使用 YYYY-MM-DD HH:mm' };

    const fromFormatted = new Intl.DateTimeFormat('zh-CN', {
      timeZone: fromTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);

    const toFormatted = new Intl.DateTimeFormat('zh-CN', {
      timeZone: toTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);

    const tzNames: Record<string, string> = {
      'Asia/Shanghai': '北京时间',
      'Asia/Tokyo': '东京时间',
      'America/New_York': '纽约时间',
      'Europe/London': '伦敦时间',
      'America/Los_Angeles': '洛杉矶时间',
      'Australia/Sydney': '悉尼时间',
    };

    return {
      success: true,
      data: `【时区转换】\n${tzNames[fromTz] || fromTz}: ${fromFormatted}\n${tzNames[toTz] || toTz}: ${toFormatted}`,
    };
  } catch (e) {
    return { success: false, error: `转换失败: ${(e as Error).message}` };
  }
}

export async function passwordGenerator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const length = Math.max(4, Number(input.length ?? 16));
    const count = Math.min(20, Math.max(1, Number(input.count ?? 5)));
    const includeUpper = input.includeUpper !== false;
    const includeLower = input.includeLower !== false;
    const includeNumbers = input.includeNumbers !== false;
    const includeSymbols = input.includeSymbols !== false;

    let chars = '';
    if (includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    const passwords: string[] = [];
    for (let i = 0; i < count; i++) {
      const array = new Uint32Array(length);
      crypto.getRandomValues(array);
      let password = '';
      for (let j = 0; j < length; j++) {
        password += chars[array[j] % chars.length];
      }
      passwords.push(password);
    }

    return {
      success: true,
      data: passwords.join('\n'),
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function exchangeRate(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const amount = Number(input.amount);
    const from = (input.from as string) || 'USD';
    const to = (input.to as string) || 'CNY';

    if (!amount || amount <= 0) return { success: false, error: '请输入有效的金额' };

    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );
    if (!response.ok) return { success: false, error: '无法获取汇率数据，请稍后重试' };

    const data = await response.json();
    const rate = data.rates?.[to];

    if (!rate) return { success: false, error: `不支持该货币: ${to}` };

    const result = (amount * rate).toFixed(2);
    const currencyNames: Record<string, string> = {
      USD: '美元', CNY: '人民币', EUR: '欧元', GBP: '英镑',
      JPY: '日元', KRW: '韩元', HKD: '港币', TWD: '新台币',
      AUD: '澳元', CAD: '加元', SGD: '新加坡元', THB: '泰铢',
    };

    return {
      success: true,
      data: {
        换算结果: `${amount} ${currencyNames[from] || from} = ${result} ${currencyNames[to] || to}`,
        汇率: `1 ${from} = ${rate.toFixed(4)} ${to}`,
        更新时间: data.date || '未知',
        提示: '汇率数据仅供参考，实际交易以银行汇率为准',
      },
    };
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('fetch') || msg.includes('NetworkError') || msg.includes('Failed to fetch')) {
      return { success: false, error: '汇率查询需要联网使用，请检查网络连接后重试' };
    }
    return { success: false, error: `汇率查询失败: ${msg}` };
  }
}

export async function sensitiveMask(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const text = input.text as string;
    const mode = (input.mode as string) || 'all';

    if (!text) return { success: false, error: '请输入文本内容' };

    let result = text;

    const maskPhone = (t: string) => t.replace(/1[3-9]\d{9}/g, (m) => m.slice(0, 3) + '****' + m.slice(7));
    const maskIdCard = (t: string) => t.replace(/[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g, (m) => m.slice(0, 4) + '**********' + m.slice(14));
    const maskBankCard = (t: string) => t.replace(/\d{16,19}/g, (m) => m.slice(0, 4) + '********' + m.slice(-4));

    if (mode === 'phone' || mode === 'all') result = maskPhone(result);
    if (mode === 'idcard' || mode === 'all') result = maskIdCard(result);
    if (mode === 'bankcard' || mode === 'all') result = maskBankCard(result);

    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function simpleCalculator(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const expression = input.expression as string;
    if (!expression?.trim()) return { success: false, error: '请输入计算表达式' };

    const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
    if (!sanitized) return { success: false, error: '表达式格式不正确' };

    const result = new Function(`"use strict"; return (${sanitized})`)();

    if (typeof result !== 'number' || !isFinite(result)) {
      return { success: false, error: '计算结果无效，请检查表达式' };
    }

    const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(6).replace(/\.?0+$/, '');

    return {
      success: true,
      data: `【计算结果】\n表达式: ${expression}\n结果: ${formatted}`,
    };
  } catch (e) {
    return { success: false, error: `计算失败: ${(e as Error).message}` };
  }
}

function formatMs(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
}

export async function stopwatch(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const action = (input.action as string) || 'start';
    const lapsInput = (input.laps as string) || '';

    const now = Date.now();
    const existingLaps = lapsInput ? lapsInput.split(',').map(Number).filter(n => !isNaN(n)) : [];

    if (action === 'start') {
      return {
        success: true,
        data: `【秒表已启动】\n开始时间: ${new Date(now).toLocaleTimeString('zh-CN')}\n\n提示: 选择"计次"记录分段时间，选择"停止"结束计时\n\n计次时请将"已有计次"填写为: ${now}`,
      };
    }

    if (action === 'lap' && existingLaps.length > 0) {
      const startTime = existingLaps[0];
      const elapsed = now - startTime;
      const lastLapEnd = existingLaps.length > 1 ? existingLaps[existingLaps.length - 1] : startTime;
      const lapTime = now - lastLapEnd;

      const newLaps = [...existingLaps, now];
      const lapResults: string[] = [];
      let prevTime = startTime;
      for (let i = 1; i < newLaps.length; i++) {
        const lapDuration = newLaps[i] - prevTime;
        lapResults.push(`第${i}次: ${formatMs(lapDuration)}`);
        prevTime = newLaps[i];
      }

      return {
        success: true,
        data: `【秒表计次】\n本次计次: ${formatMs(lapTime)}\n总用时: ${formatMs(elapsed)}\n\n${lapResults.join('\n')}\n\n继续计次请填写"已有计次": ${newLaps.join(',')}`,
      };
    }

    if (action === 'stop' && existingLaps.length > 0) {
      const startTime = existingLaps[0];
      const elapsed = now - startTime;

      const lapResults: string[] = [];
      let prevTime = startTime;
      for (let i = 1; i < existingLaps.length; i++) {
        const lapDuration = existingLaps[i] - prevTime;
        lapResults.push(`第${i}次: ${formatMs(lapDuration)}`);
        prevTime = existingLaps[i];
      }
      const lastLap = now - prevTime;
      lapResults.push(`第${existingLaps.length}次: ${formatMs(lastLap)}`);

      return {
        success: true,
        data: `【秒表停止】\n总用时: ${formatMs(elapsed)}\n\n${lapResults.join('\n')}`,
      };
    }

    return { success: false, error: '请先选择"开始计时"启动秒表' };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function countdown(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const targetDate = input.targetDate as string;
    const targetTime = (input.targetTime as string) || '00:00';
    const eventName = (input.eventName as string) || '目标';

    if (!targetDate) return { success: false, error: '请输入目标日期' };

    const target = new Date(`${targetDate}T${targetTime}:00`);
    if (isNaN(target.getTime())) return { success: false, error: '日期格式不正确' };

    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      const passed = now.getTime() - target.getTime();
      const days = Math.floor(passed / 86400000);
      const hours = Math.floor((passed % 86400000) / 3600000);
      return {
        success: true,
        data: `【${eventName}】\n目标时间: ${target.toLocaleString('zh-CN')}\n\n已过去 ${days} 天 ${hours} 小时`,
      };
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const totalHours = Math.floor(diff / 3600000);
    const totalMinutes = Math.floor(diff / 60000);

    return {
      success: true,
      data: `【${eventName}倒计时】\n目标时间: ${target.toLocaleString('zh-CN')}\n\n剩余 ${days} 天 ${hours} 小时 ${minutes} 分 ${seconds} 秒\n\n≈ ${totalHours} 小时\n≈ ${totalMinutes} 分钟`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
