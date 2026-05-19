import type { ToolOutput } from '@/types';

const chinaHolidays2026: Record<string, string> = {
  '2026-01-01': '元旦', '2026-01-28': '除夕', '2026-01-29': '春节', '2026-01-30': '春节', '2026-01-31': '春节', '2026-02-01': '春节', '2026-02-02': '春节', '2026-02-03': '春节',
  '2026-04-04': '清明节', '2026-05-01': '劳动节', '2026-05-02': '劳动节', '2026-05-03': '劳动节',
  '2026-06-19': '端午节', '2026-09-25': '中秋节', '2026-10-01': '国庆节', '2026-10-02': '国庆节', '2026-10-03': '国庆节', '2026-10-04': '国庆节', '2026-10-05': '国庆节', '2026-10-06': '国庆节', '2026-10-07': '国庆节',
};

export async function workingDaysCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const start = input.start as string;
    const days = Number(input.days) || 30;
    if (!start) return { success: false, error: '请输入开始日期' };
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return { success: false, error: '日期格式无效' };
    let naturalDays = 0, workDays = 0;
    const endDate = new Date(startDate);
    while (naturalDays < days) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + naturalDays);
      const key = d.toISOString().split('T')[0];
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6 && !chinaHolidays2026[key]) workDays++;
      naturalDays++;
    }
    endDate.setDate(endDate.getDate() + naturalDays - 1);
    return { success: true, data: { 开始日期: start, 结束日期: endDate.toISOString().split('T')[0], 自然日: `${naturalDays} 天`, 工作日: `${workDays} 天`, 节假日: `${naturalDays - workDays} 天`, 提示: '仅计算了周末和2026年已知节假日，调休未做处理' } };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function lunarCalendarQuery(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const dateStr = input.date as string || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { success: false, error: '日期格式无效' };
    const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const zodiacYear = zodiacAnimals[(date.getFullYear() - 4) % 12];
    const stemBranches = ['甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉','甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未','甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳','甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯','甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑','甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'];
    const sbIndex = (date.getFullYear() - 4) % 60;
    const stemBranch = stemBranches[sbIndex >= 0 ? sbIndex : sbIndex + 60] || '未知';
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
    const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
    const solarTerms = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'];
    const termIdx = Math.floor(((date.getMonth() * 30 + date.getDate()) / 30) * 2) % 24;
    return {
      success: true,
      data: {
        公历日期: dateStr,
        星期: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
        生肖: zodiacYear,
        干支纪年: stemBranch + '年',
        节气参考: solarTerms[termIdx],
        提示: '农历为简化估算，精确农历请使用专业黄历工具',
      },
    };
  } catch (e) { return { success: false, error: `查询失败: ${(e as Error).message}` }; }
}

export async function zodiacQuery(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const birth = input.birth as string;
    if (!birth) return { success: false, error: '请输入出生日期' };
    const birthDate = new Date(birth);
    if (isNaN(birthDate.getTime())) return { success: false, error: '日期格式无效' };
    const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const zodiac = zodiacAnimals[(birthDate.getFullYear() - 4) % 12];
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    let constellation = '';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) constellation = '水瓶座';
    else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) constellation = '双鱼座';
    else if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) constellation = '白羊座';
    else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) constellation = '金牛座';
    else if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) constellation = '双子座';
    else if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) constellation = '巨蟹座';
    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) constellation = '狮子座';
    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) constellation = '处女座';
    else if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) constellation = '天秤座';
    else if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) constellation = '天蝎座';
    else if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) constellation = '射手座';
    else constellation = '摩羯座';
    return { success: true, data: { 出生日期: birth, 生肖: zodiac, 星座: constellation, 提示: '星座按公历日期划分' } };
  } catch (e) { return { success: false, error: `查询失败: ${(e as Error).message}` }; }
}

export async function anniversaryTracker(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const dates = input.dates as string;
    if (!dates) return { success: false, error: '请输入纪念日信息' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const lines = dates.split('\n').filter(l => l.trim());
    const results: string[] = [];
    for (const line of lines) {
      const parts = line.split(/[,，\s]+/);
      const name = parts[0] || '';
      const dateStr = parts[1] || '';
      if (!name || !dateStr) continue;
      let target = new Date(dateStr);
      if (isNaN(target.getTime())) { results.push(`${name}: 日期格式无效`); continue; }
      while (target.getFullYear() < today.getFullYear()) target.setFullYear(target.getFullYear() + 1);
      const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      const diff = Math.ceil((t.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      const yearsElapsed = target.getFullYear() - new Date(dateStr).getFullYear();
      results.push(`${name}: ${t.toISOString().split('T')[0]} ${diff > 0 ? `还有${diff}天` : diff === 0 ? '就是今天!' : `已过${Math.abs(diff)}天`} | 第${yearsElapsed}年`);
    }
    return { success: true, data: { 纪念日列表: results.join('\n'), 提示: '每行格式：名称,日期（如：生日,2010-01-01），支持多个纪念日' } };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}