import type { ToolOutput } from '@/types';

const executorMap: Record<string, (input: Record<string, unknown>) => Promise<ToolOutput>> = {
  'image-compress': (input) => import('@/tools/implementations/imageTools').then(m => m.imageCompress(input)),
  'image-convert': (input) => import('@/tools/implementations/imageTools').then(m => m.imageConvert(input)),
  'image-resize': (input) => import('@/tools/implementations/imageTools').then(m => m.imageResize(input)),
  'id-photo': (input) => import('@/tools/implementations/imageTools').then(m => m.idPhoto(input)),
  'image-watermark': (input) => import('@/tools/implementations/imageTools').then(m => m.imageWatermark(input)),
  'image-watermark-remove': (input) => import('@/tools/implementations/imageTools').then(m => m.imageWatermarkRemove(input)),
  'image-stitch': (input) => import('@/tools/implementations/imageTools').then(m => m.imageStitch(input)),
  'image-ocr': (input) => import('@/tools/implementations/imageTools').then(m => m.imageOcr(input)),
  'image-to-pdf': (input) => import('@/tools/implementations/imageTools').then(m => m.imageToPdf(input)),
  'screenshot-annotate': (input) => import('@/tools/implementations/imageTools').then(m => m.screenshotAnnotate(input)),
  'text-counter': (input) => import('@/tools/implementations/documentTools').then(m => m.textCounter(input)),
  'traditional-simplified': (input) => import('@/tools/implementations/documentTools').then(m => m.traditionalSimplified(input)),
  'case-converter': (input) => import('@/tools/implementations/documentTools').then(m => m.caseConverter(input)),
  'text-dedup': (input) => import('@/tools/implementations/documentTools').then(m => m.textDedup(input)),
  'text-summary': (input) => import('@/tools/implementations/aiTools').then(m => m.textSummary(input)),
  'text-translate': (input) => import('@/tools/implementations/aiTools').then(m => m.textTranslate(input)),
  'speech-to-text': (input) => import('@/tools/implementations/aiTools').then(m => m.speechToText(input)),
  'text-to-speech': (input) => import('@/tools/implementations/aiTools').then(m => m.textToSpeech(input)),
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
  'file-compress': (input) => import('@/tools/implementations/mediaTools').then(m => m.fileCompress(input)),
  'exchange-rate': (input) => import('@/tools/implementations/lifeTools').then(m => m.exchangeRate(input)),
  'image-crop': (input) => import('@/tools/implementations/imageTools').then(m => m.imageCrop(input)),
  'pdf-merge': (input) => import('@/tools/implementations/imageTools').then(m => m.pdfMerge(input)),
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
