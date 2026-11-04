import { toast } from 'sonner';

export const VERCEL_SAFE_UPLOAD_BYTES = 4 * 1024 * 1024;
export const SMALL_IMAGE_UPLOAD_BYTES = 300 * 1024;

export function validateImageFile(
  file: File,
  maxSizeBytes = VERCEL_SAFE_UPLOAD_BYTES,
  maxSizeLabel = '4MB',
) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    toast.error('Format gambar harus JPG, PNG, atau WebP.');
    return false;
  }
  if (file.size > maxSizeBytes) {
    toast.error(`Ukuran gambar maksimal ${maxSizeLabel}`);
    return false;
  }
  return true;
}
