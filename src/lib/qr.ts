import QRCode from 'qrcode';

/**
 * Generate a high-contrast SVG or PNG Data URL for event check-in passes.
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('[QR] Failed to generate QR code:', error);
    return '';
  }
}
