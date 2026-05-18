import type { ToolOutput } from '@/types';
import { imageCompress, imageConvert, imageResize, idPhoto, imageWatermark, imageWatermarkRemove, imageStitch, imageOcr, imageToPdf, screenshotAnnotate } from '@/tools/implementations/imageTools';
import { textCounter, traditionalSimplified, caseConverter, textDedup } from '@/tools/implementations/documentTools';
import { textSummary, textTranslate, speechToText, textToSpeech, eSignature } from '@/tools/implementations/aiTools';
import { qrcodeGenerator, unitConverter, mortgageCalculator, taxCalculator, bmiCalculator, dateCalculator, randomDecision, luckyDraw, pomodoroTimer, timezoneConverter, passwordGenerator, sensitiveMask, simpleCalculator, stopwatch, countdown } from '@/tools/implementations/lifeTools';
import { videoToGif, fileCompress } from '@/tools/implementations/mediaTools';

const executorMap: Record<string, (input: Record<string, unknown>) => Promise<ToolOutput>> = {
  'image-compress': imageCompress,
  'image-convert': imageConvert,
  'image-resize': imageResize,
  'id-photo': idPhoto,
  'image-watermark': imageWatermark,
  'image-watermark-remove': imageWatermarkRemove,
  'image-stitch': imageStitch,
  'image-ocr': imageOcr,
  'image-to-pdf': imageToPdf,
  'screenshot-annotate': screenshotAnnotate,
  'text-counter': textCounter,
  'traditional-simplified': traditionalSimplified,
  'case-converter': caseConverter,
  'text-dedup': textDedup,
  'text-summary': textSummary,
  'text-translate': textTranslate,
  'speech-to-text': speechToText,
  'text-to-speech': textToSpeech,
  'e-signature': eSignature,
  'qrcode-generator': qrcodeGenerator,
  'unit-converter': unitConverter,
  'mortgage-calculator': mortgageCalculator,
  'tax-calculator': taxCalculator,
  'bmi-calculator': bmiCalculator,
  'date-calculator': dateCalculator,
  'random-decision': randomDecision,
  'lucky-draw': luckyDraw,
  'pomodoro-timer': pomodoroTimer,
  'timezone-converter': timezoneConverter,
  'password-generator': passwordGenerator,
  'sensitive-mask': sensitiveMask,
  'simple-calculator': simpleCalculator,
  'stopwatch': stopwatch,
  'countdown': countdown,
  'video-to-gif': videoToGif,
  'file-compress': fileCompress,
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
