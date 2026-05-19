import type { ToolOutput } from '@/types';

export async function socialInsuranceCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const salary = Number(input.salary) || 0;
    if (salary <= 0) return { success: false, error: '请输入有效的工资' };
    const city = (input.city as string) || '北京';
    const insuranceBase = Math.max(3613, Math.min(26541, salary));
    const housingBase = Math.max(2200, Math.min(27786, salary));
    const pension = insuranceBase * 0.08;
    const medical = insuranceBase * 0.02 + 3;
    const unemployment = insuranceBase * 0.005;
    const housing = housingBase * 0.12;
    const totalDeduct = pension + medical + unemployment + housing;
    const netSalary = salary - totalDeduct;
    return {
      success: true,
      data: {
        城市: city,
        税前工资: `¥${salary.toFixed(2)}`,
        养老保险: `¥${pension.toFixed(2)}`,
        医疗保险: `¥${medical.toFixed(2)}`,
        失业保险: `¥${unemployment.toFixed(2)}`,
        公积金: `¥${housing.toFixed(2)}`,
        五险一金合计: `¥${totalDeduct.toFixed(2)}`,
        到手工资: `¥${netSalary.toFixed(2)}`,
        提示: '按缴费基数上下限估算，实际以当地政策为准',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function savingsInterestCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const principal = Number(input.principal) || 0;
    const rate = Number(input.rate) || 0;
    const years = Number(input.years) || 1;
    const type = (input.type as string) || 'current';
    if (principal <= 0) return { success: false, error: '请输入有效的本金' };
    let totalInterest: number;
    let finalAmount: number;
    if (type === 'current') {
      totalInterest = principal * (rate / 100) * years;
      finalAmount = principal + totalInterest;
    } else {
      finalAmount = principal * Math.pow(1 + rate / 100, years);
      totalInterest = finalAmount - principal;
    }
    return {
      success: true,
      data: {
        本金: `¥${principal.toFixed(2)}`,
        年利率: `${rate}%`,
        存款年限: `${years} 年`,
        存款类型: type === 'current' ? '活期' : '定期复利',
        利息总额: `¥${totalInterest.toFixed(2)}`,
        到期本息: `¥${finalAmount.toFixed(2)}`,
        提示: '计算结果仅供参考，实际以银行利率为准',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function earlyRepaymentCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const remaining = Number(input.remaining) || 0;
    const rate = Number(input.rate) || 0;
    const remainYears = Number(input.remainYears) || 0;
    const prepay = Number(input.prepay) || 0;
    if (remaining <= 0 || prepay <= 0) return { success: false, error: '请输入有效的贷款余额和提前还款金额' };
    const monthlyRate = rate / 100 / 12;
    const totalMonths = remainYears * 12;
    const monthlyPayment = remaining * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    const totalInterestOld = monthlyPayment * totalMonths - remaining;
    const newRemaining = remaining - prepay;
    if (newRemaining <= 0) {
      return { success: true, data: { 提前还款金额: `¥${prepay.toFixed(2)}`, 省利息: `¥${totalInterestOld.toFixed(2)}`, 提示: '恭喜，可还清所有贷款！' } };
    }
    const monthlyPaymentNew = newRemaining * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    const totalInterestNew = monthlyPaymentNew * totalMonths - newRemaining;
    const savedInterest = totalInterestOld - totalInterestNew;
    return {
      success: true,
      data: {
        剩余贷款: `¥${remaining.toFixed(2)}`,
        提前还款: `¥${prepay.toFixed(2)}`,
        原月供: `¥${monthlyPayment.toFixed(2)}`,
        新月供: `¥${monthlyPaymentNew.toFixed(2)}`,
        月供减少: `¥${(monthlyPayment - monthlyPaymentNew).toFixed(2)}`,
        省利息: `¥${savedInterest.toFixed(2)}`,
        提示: '此为等额本息简化计算，实际以银行核算为准',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function yearEndBonusTaxCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const bonus = Number(input.bonus) || 0;
    if (bonus <= 0) return { success: false, error: '请输入有效的年终奖金额' };
    const monthlyAvg = bonus / 12;
    let rate = 0, deduction = 0;
    if (monthlyAvg <= 3000) { rate = 0.03; deduction = 0; }
    else if (monthlyAvg <= 12000) { rate = 0.10; deduction = 210; }
    else if (monthlyAvg <= 25000) { rate = 0.20; deduction = 1410; }
    else if (monthlyAvg <= 35000) { rate = 0.25; deduction = 2660; }
    else if (monthlyAvg <= 55000) { rate = 0.30; deduction = 4410; }
    else if (monthlyAvg <= 80000) { rate = 0.35; deduction = 7160; }
    else { rate = 0.45; deduction = 15160; }
    const tax = bonus * rate - deduction;
    const netBonus = bonus - tax;
    return {
      success: true,
      data: {
        年终奖: `¥${bonus.toFixed(2)}`,
        适用税率: `${(rate * 100).toFixed(0)}%`,
        应纳税额: `¥${tax.toFixed(2)}`,
        到手奖金: `¥${netBonus.toFixed(2)}`,
        提示: '按全年一次性奖金单独计税方式计算，可选择并入综合所得更优方案',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function investmentReturnCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const principal = Number(input.principal) || 0;
    const monthly = Number(input.monthly) || 0;
    const rate = Number(input.rate) || 4;
    const years = Number(input.years) || 5;
    if (principal < 0) return { success: false, error: '请输入有效的金额' };
    let total = principal;
    let totalInvested = principal;
    const monthlyRate = rate / 100 / 12;
    const months = years * 12;
    for (let i = 0; i < months; i++) {
      total = total * (1 + monthlyRate) + monthly;
      totalInvested += monthly;
    }
    const pureReturn = total - totalInvested;
    return {
      success: true,
      data: {
        初始本金: `¥${principal.toFixed(2)}`,
        每月定投: `¥${monthly.toFixed(2)}`,
        年化收益率: `${rate}%`,
        投资年限: `${years} 年`,
        投入总额: `¥${totalInvested.toFixed(2)}`,
        到期总值: `¥${total.toFixed(2)}`,
        纯收益: `¥${pureReturn.toFixed(2)}`,
        收益率: `${((pureReturn / totalInvested) * 100).toFixed(1)}%`,
        提示: '此为理论复利计算，实际收益受市场波动影响',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function carTaxCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const price = Number(input.price) || 0;
    const displacement = Number(input.displacement) || 1.6;
    if (price <= 0) return { success: false, error: '请输入有效车价' };
    const tax = price / 1.13 * 0.1;
    let insurance = 5000;
    if (price > 200000) insurance = 8000;
    if (price > 300000) insurance = 11000;
    const licenseFee = 500;
    const total = price + tax + insurance + licenseFee;
    return {
      success: true,
      data: {
        裸车价: `¥${price.toFixed(2)}`,
        购置税: `¥${tax.toFixed(2)}`,
        保险费估算: `¥${insurance.toFixed(2)}`,
        上牌杂费: `¥${licenseFee.toFixed(2)}`,
        落地总价: `¥${total.toFixed(2)}`,
        排量: `${displacement}L`,
        提示: '保险为估算值，新能源车免征购置税',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}