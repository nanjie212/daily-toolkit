/**
 * 将 Date 格式化为本地时区的 YYYY-MM-DD 字符串。
 *
 * 不要用 Date.toISOString().split('T')[0] 来显示用户可见的日历日期：
 * toISOString() 返回的是 UTC 时间，在中国时区（UTC+8）会把本地零点
 * 的日期当成前一天，导致显示少一天。本函数始终按本地年月日输出。
 */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
