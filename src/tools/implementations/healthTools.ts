import type { ToolOutput } from '@/types';

const foodCalorieDB: Record<string, number> = {
  米饭: 116, 馒头: 223, 面条: 110, 鸡蛋: 144, 牛奶: 54, 苹果: 53, 香蕉: 93,
  鸡胸肉: 133, 猪肉: 395, 牛肉: 125, 面包: 266, 巧克力: 546, 薯片: 536, 可乐: 42,
  橙汁: 47, 咖啡: 1, 奶茶: 60, 火锅: 200, 烧烤: 250, 蛋糕: 347,
};
const sportCalorieDB: Record<string, number> = {
  跑步: 7.0, 快走: 3.5, 游泳: 8.3, 骑车: 5.5, 跳绳: 8.8, 瑜伽: 2.5, 篮球: 6.4,
  羽毛球: 5.1, 爬楼梯: 8.0, 平板支撑: 3.0, HIIT: 10.0,
};

export async function calorieCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const mode = (input.mode as string) || 'food';
    const foodName = input.foodName as string;
    const foodWeight = Number(input.foodWeight) || 100;
    const sportName = input.sportName as string;
    const sportMin = Number(input.sportMin) || 30;
    if (mode === 'food' && foodName) {
      const caloryPer100 = foodCalorieDB[foodName];
      if (!caloryPer100) return { success: false, error: '未收录该食物热量，请选择列表中的食物' };
      const totalCal = caloryPer100 * foodWeight / 100;
      return { success: true, data: { 食物: foodName, 重量: `${foodWeight}g`, 每100g热量: `${caloryPer100} 千卡`, 总计热量: `${totalCal.toFixed(0)} 千卡`, 提示: '热量数据为近似值，不同烹饪方式会有所差异' } };
    }
    if (mode === 'sport' && sportName) {
      const calPerKg = sportCalorieDB[sportName];
      if (!calPerKg) return { success: false, error: '未收录该运动热量消耗数据' };
      const weight = Number(input.weight) || 65;
      const burned = calPerKg * weight * sportMin / 60;
      return { success: true, data: { 运动: sportName, 体重: `${weight}kg`, 时长: `${sportMin} 分钟`, 消耗热量: `${burned.toFixed(0)} 千卡`, 提示: '实际消耗因运动强度和个人体质而异' } };
    }
    const foods = Object.entries(foodCalorieDB).map(([k, v]) => `${k}(${v}千卡/100g)`).join(', ');
    return { success: true, data: { 食物热量库: foods, 提示: '选择食物模式输入重量，或选择运动模式算消耗' } };
  } catch (e) { return { success: false, error: `查询失败: ${(e as Error).message}` }; }
}

export async function dueDateCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const lmp = input.lmp as string;
    if (!lmp) return { success: false, error: '请输入末次月经日期' };
    const lmpDate = new Date(lmp);
    if (isNaN(lmpDate.getTime())) return { success: false, error: '日期格式无效' };
    const dueDate = new Date(lmpDate);
    dueDate.setDate(dueDate.getDate() + 280);
    const today = new Date();
    const weeks = Math.floor((today.getTime() - lmpDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const days = Math.floor((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    const trimester = weeks <= 13 ? '孕早期' : weeks <= 28 ? '孕中期' : '孕晚期';
    return {
      success: true,
      data: {
        末次月经: lmp,
        预产期: dueDate.toISOString().split('T')[0],
        当前孕周: `第${weeks}周`,
        当前阶段: trimester,
        距离预产期: `${days} 天`,
        提示: '预产期为Naegele公式估算，实际可能偏离±2周',
      },
    };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function bodyFatCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const weight = Number(input.weight) || 0;
    const waist = Number(input.waist) || 0;
    const gender = (input.gender as string) || 'male';
    const neck = Number(input.neck) || (gender === 'male' ? 38 : 33);
    const height = Number(input.height) || 170;
    if (weight <= 0 || waist <= 0) return { success: false, error: '请输入体重和腰围' };
    const bmi = weight / ((height / 100) ** 2);
    let bodyFat: number;
    if (gender === 'male') {
      bodyFat = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
    } else {
      const hip = Number(input.hip) || 95;
      bodyFat = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387;
    }
    bodyFat = Math.max(3, Math.min(50, bodyFat));
    let level: string;
    if (gender === 'male') {
      if (bodyFat < 6) level = '极低'; else if (bodyFat < 14) level = '运动员'; else if (bodyFat < 18) level = '健康'; else if (bodyFat < 25) level = '偏高'; else level = '肥胖';
    } else {
      if (bodyFat < 14) level = '极低'; else if (bodyFat < 21) level = '运动员'; else if (bodyFat < 25) level = '健康'; else if (bodyFat < 32) level = '偏高'; else level = '肥胖';
    }
    return { success: true, data: { BMI: bmi.toFixed(1), 体脂率: `${bodyFat.toFixed(1)}%`, 体脂等级: level, 腰围: `${waist}cm`, 体重: `${weight}kg`, 提示: '采用美国海军方法估算，误差约±3%' } };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function bmrCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const weight = Number(input.weight) || 65;
    const height = Number(input.height) || 170;
    const age = Number(input.age) || 25;
    const gender = (input.gender as string) || 'male';
    if (weight <= 0 || height <= 0 || age <= 0) return { success: false, error: '请输入有效的体重、身高和年龄' };
    let bmr: number;
    if (gender === 'male') bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    else bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    const activity = Number(input.activity) || 1.55;
    const tdee = bmr * activity;
    const levelNames: Record<string, string> = { '1.2': '久坐不动', '1.375': '轻度活动', '1.55': '中度活动', '1.725': '活跃', '1.9': '重度活动' };
    return { success: true, data: { 性别: gender === 'male' ? '男' : '女', 体重: `${weight}kg`, 身高: `${height}cm`, 年龄: `${age}岁`, 基础代谢BMR: `${bmr.toFixed(0)} 千卡/天`, 每日消耗TDEE: `${tdee.toFixed(0)} 千卡/天`, 活动水平: levelNames[String(activity)] || '自定义', 减脂摄入: `${Math.round(tdee * 0.8)} 千卡/天`, 增肌摄入: `${Math.round(tdee * 1.15)} 千卡/天`, 提示: 'Mifflin-St Jeor公式计算，减脂/增肌建议基于±20%/15%的TDEE调整' } };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}

export async function heartRateZoneCalc(input: Record<string, unknown>): Promise<ToolOutput> {
  try {
    const age = Number(input.age) || 30;
    const restHR = Number(input.restHR) || 70;
    if (age <= 0) return { success: false, error: '请输入有效年龄' };
    const maxHR = 220 - age;
    const reserveHR = maxHR - restHR;
    return { success: true, data: { 最大心率: `${maxHR} 次/分`, 安静心率: `${restHR} 次/分`, 热身区间: `${Math.round(restHR + reserveHR * 0.5)}-${Math.round(restHR + reserveHR * 0.6)} 次/分`, 燃脂区间: `${Math.round(restHR + reserveHR * 0.6)}-${Math.round(restHR + reserveHR * 0.7)} 次/分`, 有氧区间: `${Math.round(restHR + reserveHR * 0.7)}-${Math.round(restHR + reserveHR * 0.8)} 次/分`, 无氧区间: `${Math.round(restHR + reserveHR * 0.8)}-${Math.round(restHR + reserveHR * 0.9)} 次/分`, 极限区间: `${Math.round(restHR + reserveHR * 0.9)}-${maxHR} 次/分`, 提示: '220-年龄公式估算最大心率，心率区间采用Karvonen储备心率法' } };
  } catch (e) { return { success: false, error: `计算失败: ${(e as Error).message}` }; }
}