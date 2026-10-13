import { toast } from 'sonner';

// Keep aligned with BE MAX_FILE_SIZE (10MB)
export function validateImageFile(file: File, maxSizeMb = 10) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  if (!allowedTypes.includes(file.type)) {
    toast.error('Format gambar harus JPG, PNG, atau WebP.');
    return false;
  }
  if (file.size > maxSizeBytes) {
    toast.error(`Ukuran gambar maksimal ${maxSizeMb}MB`);
    return false;
  }
  return true;
}
