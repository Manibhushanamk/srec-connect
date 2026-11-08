import sharp from 'sharp';
import { MAX_IMAGE_FILE_SIZE, MAX_POST_IMAGES } from './media-constants';

export { MAX_IMAGE_FILE_SIZE, MAX_POST_IMAGES };

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: 'webp';
  size: number;
  contentType: 'image/webp';
}

export async function processPostImage(inputBuffer: Buffer): Promise<ProcessedImage> {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  if (!metadata.format || !['jpeg', 'jpg', 'png', 'webp', 'avif'].includes(metadata.format)) {
    throw new Error('Unsupported image format. Accepted formats: JPG, PNG, WebP.');
  }

  // Resize to max 1200x1200 maintaining aspect ratio, convert to WebP with 80% quality
  let quality = 80;
  let processedBuffer = await image
    .resize({
      width: 1200,
      height: 1200,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();

  // If over 500 KB, incrementally adjust quality down to meet strict 500 KB constraint
  while (processedBuffer.length > MAX_IMAGE_FILE_SIZE && quality > 40) {
    quality -= 10;
    processedBuffer = await sharp(inputBuffer)
      .resize({
        width: 1000,
        height: 1000,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();
  }

  if (processedBuffer.length > MAX_IMAGE_FILE_SIZE) {
    throw new Error(`Processed image size (${Math.round(processedBuffer.length / 1024)} KB) exceeds 500 KB limit.`);
  }

  const processedMeta = await sharp(processedBuffer).metadata();

  return {
    buffer: processedBuffer,
    width: processedMeta.width || 800,
    height: processedMeta.height || 600,
    format: 'webp',
    size: processedBuffer.length,
    contentType: 'image/webp',
  };
}
