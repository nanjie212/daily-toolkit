import type { ToolOutput } from '@/types';
import { toLocalDateStr, parseLocalDate } from '@/lib/date';
import { isValidCalendarDate } from '@/lib/validation';

/** 循环推算日期时允许的最大天数，防止用户误填超大数字把页面算死 */
const MAX_SPAN_DAYS = 3650;

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
    // 用 parseLocalDate 而非 new Date(str)：后者会把 2024-02-30 静默顺延成 03-01
    const startDate = parseLocalDate(start);
    if (!startDate) return { success: false, error: `"${start}" 不是有效日期，请使用 YYYY-MM-DD 格式且日期须真实存在` };
    if (!Number.isFinite(days) || days < 1) return { success: false, error: '天数必须是大于 0 的数字' };
    if (days > MAX_SPAN_DAYS) return { success: false, error: `天数不能超过 ${MAX_SPAN_DAYS} 天` };

    const totalDays = Math.floor(days);
    let workDays = 0;
    for (let offset = 0; offset < totalDays; offset++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + offset);
      // 按本地年月日取 key，避免 toISOString() 的 UTC 偏移导致节假日错位一天
      const key = toLocalDateStr(d);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6 && !chinaHolidays2026[key]) workDays++;
    }
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays - 1);
    return { success: true, data: { 开始日期: start, 结束日期: toLocalDateStr(endDate), 自然日: `${totalDays} 天`, 工作日: `${workDays} 天`, 节假日: `${totalDays - workDays} 天`, 提示: '仅计算了周末和2026年已知节假日，调休未做处理' } };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function lunarCalendarQuery(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const dateStr = (input.date as string) || toLocalDateStr(new Date());
    // 空值走「今天」，有值则必须是真实存在的日期（拒绝 2024-02-30 这类顺延输入）
    const date = parseLocalDate(dateStr);
    if (!date) return { success: false, error: `"${dateStr}" 不是有效日期，请使用 YYYY-MM-DD 格式且日期须真实存在` };
    const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const zodiacYear = zodiacAnimals[(date.getFullYear() - 4) % 12];
    const stemBranches = ['甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉','甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未','甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳','甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯','甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑','甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'];
    const sbIndex = (date.getFullYear() - 4) % 60;
    const stemBranch = stemBranches[sbIndex >= 0 ? sbIndex : sbIndex + 60] || '未知';
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return { success: false, error: '日期格式无效，请使用 YYYY-MM-DD' };
    // 原先靠 toISOString() 回比来判合法性，依赖 UTC 语义且不易读；统一改用 parseLocalDate
    const birthDate = parseLocalDate(birth);
    if (!birthDate) return { success: false, error: '日期格式无效或日期不存在' };
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
      const dateParts = dateStr.split('-').map(Number);
      if (dateParts.length !== 3 || dateParts.some(Number.isNaN)) { results.push(`${name}: 日期格式无效`); continue; }
      // 旧写法只回比了 getDate()，"2024-13-01" 会被 JS 顺延成 2025-01-01 且 day 仍为 1 从而蒙混过关；
      // isValidCalendarDate 会把年 / 月 / 日整体回比，非法日期一律拒绝。
      if (!isValidCalendarDate(dateParts[0], dateParts[1], dateParts[2])) {
        results.push(`${name}: 日期无效（${dateStr} 不是真实存在的日期）`);
        continue;
      }
      const originalYear = dateParts[0];
      const target = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      while (target.getFullYear() < today.getFullYear()) target.setFullYear(target.getFullYear() + 1);
      const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      const diff = Math.ceil((t.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      const yearsElapsed = target.getFullYear() - originalYear;
      results.push(`${name}: ${toLocalDateStr(t)} ${diff > 0 ? `还有${diff}天` : diff === 0 ? '就是今天!' : `已过${Math.abs(diff)}天`} | 第${yearsElapsed}年`);
    }
    return { success: true, data: { 纪念日列表: results.join('\n'), 提示: '每行格式：名称,日期（如：生日,2010-01-01），支持多个纪念日' } };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}