export const MAX_IMAGES = 3;

// Sanity cap on the raw file before we even try to decode it — this isn't
// what bounds the final payload size, just a cheap fast-fail for something
// absurd (e.g. an accidentally-selected video file or RAW photo).
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

// Resizes and recompresses in the browser before anything is uploaded, so a
// huge phone photo can't blow up the request payload or hang the page —
// the output size is bounded by resolution + JPEG quality, not by however
// large the original file was.
export async function processImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} isn't an image.`);
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(`${file.name} is too large (max 25MB).`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`Couldn't read ${file.name} — try a different image.`);
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error("Your browser can't process images here.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = await new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Couldn't process ${file.name}.`));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Couldn't process ${file.name}.`));
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });

  return dataUrl;
}
