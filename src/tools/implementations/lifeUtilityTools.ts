import type { ToolOutput } from '@/types';

export async function petAgeCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const petType = (input.petType as string) || 'dog';
    const petAge = Number(input.petAge) || 0;
    if (petAge <= 0) return { success: false, error: '请输入有效的宠物年龄' };
    let humanAge: number;
    if (petType === 'dog') {
      if (petAge <= 1) humanAge = petAge * 15;
      else if (petAge <= 2) humanAge = 15 + (petAge - 1) * 9;
      else humanAge = 24 + (petAge - 2) * (petAge <= 5 ? 5 : 4);
    } else {
      if (petAge <= 1) humanAge = petAge * 15;
      else if (petAge <= 2) humanAge = 15 + (petAge - 1) * 9;
      else humanAge = 24 + (petAge - 2) * 4;
    }
    return {
      success: true,
      data: {
        宠物类型: petType === 'dog' ? '狗狗' : '猫咪',
        宠物年龄: `${petAge} 岁`,
        相当于人类: `${Math.round(humanAge)} 岁`,
        生命阶段: humanAge < 20 ? '幼年' : humanAge < 40 ? '青年' : humanAge < 60 ? '中年' : '老年',
        提示: '不同品种差异很大，小体型犬比大体型犬老得慢',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function discountCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const price = Number(input.price) || 0;
    const discount = Number(input.discount) || 0;
    if (price <= 0) return { success: false, error: '请输入有效原价' };
    let final: number;
    if (discount > 0 && discount <= 10) {
      final = price * discount / 10;
    } else if (discount > 10 && discount <= 100) {
      final = price * discount / 100;
    } else {
      final = price - discount;
    }
    const saved = price - final;
    const discountRate = Math.round((1 - final / price) * 100);
    return {
      success: true,
      data: {
        原价: `¥${price.toFixed(2)}`,
        [`${discount <= 10 ? '折扣' : '优惠/满减'}`]: discount <= 10 ? `${discount}折` : `¥${discount}`,
        到手价: `¥${final.toFixed(2)}`,
        省了: `¥${saved.toFixed(2)} (${discountRate}% off)`,
        提示: '可输入折扣(1-10)、百分比(10-100)或优惠金额',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function weightedScoreCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const scores = (input.scores as string) || '';
    if (!scores.trim()) return { success: false, error: '请输入分数和权重' };
    const lines = scores.split('\n').filter(l => l.trim());
    let totalWeighted = 0, totalWeight = 0;
    const details: string[] = [];
    for (const line of lines) {
      const parts = line.split(/[,，\s]+/);
      const score = Number(parts[0]);
      const weight = Number(parts[1]) || 1;
      if (isNaN(score)) continue;
      totalWeighted += score * weight;
      totalWeight += weight;
      details.push(`${parts[0] || score} x 权重${weight} = ${(score * weight).toFixed(1)}`);
    }
    if (totalWeight === 0) return { success: false, error: '请输入有效数据' };
    const avg = totalWeighted / totalWeight;
    return {
      success: true,
      data: {
        各项明细: details.join('\n'),
        加权总分: avg.toFixed(2),
        总权重: totalWeight.toString(),
        等级: avg >= 90 ? '优秀' : avg >= 80 ? '良好' : avg >= 70 ? '中等' : avg >= 60 ? '及格' : '不及格',
        提示: '每行格式：分数,权重。如：85,3 表示85分权重3',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function clothingSizeConverter(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    return {
      success: true,
      data: {
        'type': 'size-table',
        '👔 女装尺码对照': 
          '中国\tXS\tS\tM\tL\tXL\tXXL\n美国\t2\t4\t6\t8\t10\t12\n欧洲\t32\t34\t36\t38\t40\t42\n日本\t5\t7\t9\t11\t13\t15',
        '👕 男装尺码对照':
          '中国\tS\tM\tL\tXL\tXXL\tXXXL\n美国\tXS\tS\tM\tL\tXL\tXXL\n欧洲\t44\t46\t48\t50\t52\t54\n日本\tXS\tS\tM\tL\tXL\tXXL',
        '👟 女鞋码对照':
          '中国\t35\t36\t37\t38\t39\t40\n美国\t5\t6\t7\t8\t9\t10\n欧洲\t35\t36\t37\t38\t39\t40',
        '👞 男鞋码对照':
          '中国\t39\t40\t41\t42\t43\t44\n美国\t6\t7\t8\t9\t10\t11\n欧洲\t39\t40\t41\t42\t43\t44',
        '📏 国际通用尺码标准':
          'XXS\t胸围<76cm\t腰围<60cm\t臀围<86cm\nXS\t胸围76-82cm\t腰围60-64cm\t臀围86-90cm\nS\t胸围82-88cm\t腰围64-68cm\t臀围90-94cm\nM\t胸围88-94cm\t腰围68-72cm\t臀围94-98cm\nL\t胸围94-100cm\t腰围72-76cm\t臀围98-102cm\nXL\t胸围100-106cm\t腰围76-80cm\t臀围102-106cm\nXXL\t胸围106-112cm\t腰围80-84cm\t臀围106-110cm',
        '💡 提示': '各品牌尺码存在差异，建议以具体品牌的官方尺码表为准\n上衣以胸围为主要参考，裤装以腰围为主要参考\n网购时可参考已购合身衣物的尺码标签',
      },
    };
  } catch (e) { return { success: false, error: `查询失败: ${(e as Error).message}` }; }
}

export async function periodTrackerCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const lastDate = input.lastDate as string;
    const cycleDays = Number(input.cycleDays) || 28;
    const periodDays = Number(input.periodDays) || 5;
    if (!lastDate) return { success: false, error: '请输入上次经期开始日期' };
    const last = new Date(lastDate);
    if (isNaN(last.getTime())) return { success: false, error: '日期格式无效' };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextDate = new Date(last);
    nextDate.setDate(nextDate.getDate() + cycleDays);
    const ovulationDate = new Date(nextDate);
    ovulationDate.setDate(ovulationDate.getDate() - 14);
    const safeStart = new Date(ovulationDate);
    safeStart.setDate(safeStart.getDate() - 5);
    const safeEnd = new Date(ovulationDate);
    safeEnd.setDate(safeEnd.getDate() + 4);
    const endDate = new Date(nextDate);
    endDate.setDate(endDate.getDate() + periodDays - 1);
    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    const isInPeriod = daysUntil <= 0 && Math.ceil((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)) >= 0;
    return {
      success: true,
      data: {
        下次经期: nextDate.toISOString().split('T')[0],
        经期结束: endDate.toISOString().split('T')[0],
        排卵期: `${safeStart.toISOString().split('T')[0]} ~ ${safeEnd.toISOString().split('T')[0]}`,
        当前状态: isInPeriod ? '经期中' : daysUntil > 0 ? `距下次经期 ${daysUntil} 天` : `经期已过 ${Math.abs(daysUntil)} 天`,
        周期: `${cycleDays} 天`,
        提示: '结果基于标准28天周期估算，个体差异较大仅供参考',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}