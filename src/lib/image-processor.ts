import sharp from 'sharp';
import { MAX_IMAGE_FILE_SIZE, MAX_POST_IMAGES, THUMBNAIL_MAX_BYTES } from './media-constants';

export { MAX_IMAGE_FILE_SIZE, MAX_POST_IMAGES, THUMBNAIL_MAX_BYTES };

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: 'webp';
  size: number;
  contentType: 'image/webp';
}

const SUPPORTED_INPUT_FORMATS = new Set(['jpeg', 'jpg', 'png', 'webp', 'avif', 'gif']);

export async function processPostImage(inputBuffer: Buffer): Promise<ProcessedImage> {
  const image = sharp(inputBuffer).rotate();
  const metadata = await image.metadata();

  if (!metadata.format || !SUPPORTED_INPUT_FORMATS.has(metadata.format)) {
    throw new Error('Unsupported image format. Accepted formats: JPG, PNG, WebP.');
  }

  // Resize to max 1200x1200 maintaining aspect ratio, convert to WebP
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

  // Step down adaptively to honor MAX_IMAGE_FILE_SIZE (500 KB)
  while (processedBuffer.length > MAX_IMAGE_FILE_SIZE && quality > 40) {
    quality -= 10;
    processedBuffer = await sharp(inputBuffer)
      .rotate()
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

/**
 * Generates a lightweight WebP thumbnail targeting <= 80 KB for feed cards & Drive upload.
 */
export async function processPostThumbnail(inputBuffer: Buffer): Promise<ProcessedImage> {
  const metadata = await sharp(inputBuffer).metadata();
  if (!metadata.format || !SUPPORTED_INPUT_FORMATS.has(metadata.format)) {
    throw new Error('Unsupported image format for thumbnail processing.');
  }

  let quality = 72;
  let dimension = 480;
  let thumbBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: dimension,
      height: dimension,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();

  while (thumbBuffer.length > THUMBNAIL_MAX_BYTES && quality > 42) {
    quality -= 10;
    dimension = quality <= 52 ? 360 : 420;
    thumbBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: dimension,
        height: dimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();
  }

  const thumbMeta = await sharp(thumbBuffer).metadata();

  return {
    buffer: thumbBuffer,
    width: thumbMeta.width || 480,
    height: thumbMeta.height || 360,
    format: 'webp',
    size: thumbBuffer.length,
    contentType: 'image/webp',
  };
}
