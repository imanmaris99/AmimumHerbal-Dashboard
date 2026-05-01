import { toast } from 'sonner';

export function validateImageFile(file: File, maxSizeMb = 2) {
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
