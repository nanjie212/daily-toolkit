import type { ToolOutput } from '@/types';

const executorMap: Record<string, (input: Record<string, unknown>) => Promise<ToolOutput>> = {
  'image-processor': (input) => import('@/tools/implementations/imageTools').then(m => m.imageProcessor(input)),
  'image-beautify': (input) => import('@/tools/implementations/imageBeautyTools').then(m => m.imageBeautify(input)),
  'id-photo': (input) => import('@/tools/implementations/imageTools').then(m => m.idPhoto(input)),
  'image-watermark': (input) => import('@/tools/implementations/imageTools').then(m => m.imageWatermark(input)),
  'image-watermark-remove': (input) => import('@/tools/implementations/imageTools').then(m => m.imageWatermarkRemove(input)),
  'image-stitch': (input) => import('@/tools/implementations/imageTools').then(m => m.imageStitch(input)),
  'image-to-pdf': (input) => import('@/tools/implementations/imageTools').then(m => m.imageToPdf(input)),
  'screenshot-annotate': (input) => import('@/tools/implementations/imageTools').then(m => m.screenshotAnnotate(input)),
  'image-crop': (input) => import('@/tools/implementations/imageTools').then(m => m.imageCrop(input)),
  'pdf-merge': (input) => import('@/tools/implementations/imageTools').then(m => m.pdfMerge(input)),
  'e-signature': (input) => import('@/tools/implementations/aiTools').then(m => m.eSignature(input)),
  'qrcode-generator': (input) => import('@/tools/implementations/lifeTools').then(m => m.qrcodeGenerator(input)),
  'unit-converter': (input) => import('@/tools/implementations/lifeTools').then(m => m.unitConverter(input)),
  'mortgage-calculator': (input) => import('@/tools/implementations/lifeTools').then(m => m.mortgageCalculator(input)),
  'tax-calculator': (input) => import('@/tools/implementations/lifeTools').then(m => m.taxCalculator(input)),
  'bmi-calculator': (input) => import('@/tools/implementations/lifeTools').then(m => m.bmiCalculator(input)),
  'date-calculator': (input) => import('@/tools/implementations/lifeTools').then(m => m.dateCalculator(input)),
  'random-decision': (input) => import('@/tools/implementations/lifeTools').then(m => m.randomDecision(input)),
  'lucky-draw': (input) => import('@/tools/implementations/lifeTools').then(m => m.luckyDraw(input)),
  'pomodoro-timer': (input) => import('@/tools/implementations/lifeTools').then(m => m.pomodoroTimer(input)),
  'timezone-converter': (input) => import('@/tools/implementations/lifeTools').then(m => m.timezoneConverter(input)),
  'password-generator': (input) => import('@/tools/implementations/lifeTools').then(m => m.passwordGenerator(input)),
  'sensitive-mask': (input) => import('@/tools/implementations/lifeTools').then(m => m.sensitiveMask(input)),
  'simple-calculator': (input) => import('@/tools/implementations/lifeTools').then(m => m.simpleCalculator(input)),
  'stopwatch': (input) => import('@/tools/implementations/lifeTools').then(m => m.stopwatch(input)),
  'countdown': (input) => import('@/tools/implementations/lifeTools').then(m => m.countdown(input)),
  'video-to-gif': (input) => import('@/tools/implementations/mediaTools').then(m => m.videoToGif(input)),
  'text-processor': (input) => import('@/tools/implementations/documentTools').then(m => m.textProcessor(input)),
  'text-summary': (input) => import('@/tools/implementations/aiTools').then(m => m.textSummary(input)),
  'text-to-speech': (input) => import('@/tools/implementations/aiTools').then(m => m.textToSpeech(input)),
  'social-insurance-calc': (input) => import('@/tools/implementations/financialTools').then(m => m.socialInsuranceCalc(input)),
  'savings-interest-calc': (input) => import('@/tools/implementations/financialTools').then(m => m.savingsInterestCalc(input)),
  'early-repayment-calc': (input) => import('@/tools/implementations/financialTools').then(m => m.earlyRepaymentCalc(input)),
  'year-end-bonus-tax-calc': (input) => import('@/tools/implementations/financialTools').then(m => m.yearEndBonusTaxCalc(input)),
  'investment-return-calc': (input) => import('@/tools/implementations/financialTools').then(m => m.investmentReturnCalc(input)),
  'car-tax-calc': (input) => import('@/tools/implementations/financialTools').then(m => m.carTaxCalc(input)),
  'calorie-calc': (input) => import('@/tools/implementations/healthTools').then(m => m.calorieCalc(input)),
  'due-date-calc': (input) => import('@/tools/implementations/healthTools').then(m => m.dueDateCalc(input)),
  'body-fat-calc': (input) => import('@/tools/implementations/healthTools').then(m => m.bodyFatCalc(input)),
  'bmr-calc': (input) => import('@/tools/implementations/healthTools').then(m => m.bmrCalc(input)),
  'heart-rate-zone-calc': (input) => import('@/tools/implementations/healthTools').then(m => m.heartRateZoneCalc(input)),
  'working-days-calc': (input) => import('@/tools/implementations/datetimeTools').then(m => m.workingDaysCalc(input)),
  'lunar-calendar-query': (input) => import('@/tools/implementations/datetimeTools').then(m => m.lunarCalendarQuery(input)),
  'zodiac-query': (input) => import('@/tools/implementations/datetimeTools').then(m => m.zodiacQuery(input)),
  'anniversary-tracker': (input) => import('@/tools/implementations/datetimeTools').then(m => m.anniversaryTracker(input)),
  'base64-encode': (input) => import('@/tools/implementations/encodingTools').then(m => m.base64Encode(input)),
  'id-card-parser': (input) => import('@/tools/implementations/identityTools').then(m => m.idCardParser(input)),
  'number-to-chinese': (input) => import('@/tools/implementations/identityTools').then(m => m.numberToChinese(input)),
  'what-to-eat': (input) => import('@/tools/implementations/funTools').then(m => m.whatToEat(input)),
  'fancy-text-generator': (input) => import('@/tools/implementations/funTools').then(m => m.fancyTextGenerator(input)),
  'special-symbols': (input) => import('@/tools/implementations/funTools').then(m => m.specialSymbols(input)),
  'kinship-calculator': (input) => import('@/tools/implementations/funTools').then(m => m.kinshipCalculator(input)),
  'idiom-chain': (input) => import('@/tools/implementations/funTools').then(m => m.idiomChain(input)),
  'meme-text-generator': (input) => import('@/tools/implementations/funTools').then(m => m.memeTextGenerator(input)),
  'fraction-calculator': (input) => import('@/tools/implementations/measurementTools').then(m => m.fractionCalculator(input)),
  'pet-age-calc': (input) => import('@/tools/implementations/lifeUtilityTools').then(m => m.petAgeCalc(input)),
  'discount-calc': (input) => import('@/tools/implementations/lifeUtilityTools').then(m => m.discountCalc(input)),
  'weighted-score-calc': (input) => import('@/tools/implementations/lifeUtilityTools').then(m => m.weightedScoreCalc(input)),
  'clothing-size-converter': (input) => import('@/tools/implementations/lifeUtilityTools').then(m => m.clothingSizeConverter(input)),
  'period-tracker-calc': (input) => import('@/tools/implementations/lifeUtilityTools').then(m => m.periodTrackerCalc(input)),
  'pdf-toolbox': (input) => import('@/tools/implementations/pdfTools').then(m => m.pdfToolbox(input)),
  'photo-restore': (input) => import('@/tools/implementations/magicTools').then(m => m.photoRestore(input)),
  'ai-bg-remove': (input) => import('@/tools/implementations/magicTools').then(m => m.aiBackgroundRemove(input)),
  'text-to-handwriting': (input) => import('@/tools/implementations/magicTools').then(m => m.textToHandwriting(input)),
  'word-cloud': (input) => import('@/tools/implementations/magicTools').then(m => m.wordCloudGenerate(input)),
  'pixel-art': (input) => import('@/tools/implementations/magicTools').then(m => m.pixelArtConvert(input)),
  'photo-sketch': (input) => import('@/tools/implementations/magicTools').then(m => m.photoToSketch(input)),
  'led-marquee': (input) => import('@/tools/implementations/magicTools').then(m => m.ledMarquee(input)),
  'lucky-wheel': (input) => import('@/tools/implementations/magicTools').then(m => m.luckyWheel(input)),
};

export async function executeTool(
  toolId: string,
  input: Record<string, unknown>
): Promise<ToolOutput> {
  const executor = executorMap[toolId];

  if (!executor) {
    return {
      success: false,
      error: `未找到工具执行器: ${toolId}`,
    };
  }

  try {
    return await executor(input);
  } catch (e) {
    return {
      success: false,
      error: `执行失败: ${(e as Error).message}`,
    };
  }
}