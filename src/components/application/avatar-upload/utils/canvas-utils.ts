/**
 * Canvas utilities for image processing and cropping
 */

export interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates an image element from a source URL
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Gets the cropped image from the original image and crop area
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CroppedAreaPixels,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<{ blob: Blob | null; url: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // Set canvas dimensions
  canvas.width = safeArea;
  canvas.height = safeArea;

  // Translate canvas context to center for rotation
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // Draw rotated image
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // Set canvas to final crop dimensions
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Paste rotated image with correct crop
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // Generate blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve({ blob: null, url: '' });
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      },
      'image/jpeg',
      0.95
    );
  });
}

/**
 * Compresses an image to a maximum size
 */
export async function compressImage(
  file: File,
  maxWidth: number = 500,
  maxHeight: number = 500,
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
    };
  });
}