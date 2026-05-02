import { toast } from 'sonner';

// Keep aligned with BE MAX_FILE_SIZE (10MB)
export function validateImageFile(file: File, maxSizeMb = 10) {
  const isImage = file.type.startsWith('image/');
  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  if (!isImage) {
    toast.error('File gambar harus berupa image');
    return false;
  }
  if (file.size > maxSizeBytes) {
    toast.error(`Ukuran gambar maksimal ${maxSizeMb}MB`);
    return false;
  }
  return true;
}
