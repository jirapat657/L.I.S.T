// src/utils/deleteFileFromStorage.ts
import { getStorage, ref, deleteObject } from 'firebase/storage';

/**
 * ลบไฟล์ออกจาก Firebase Storage โดยใช้ public URL ของไฟล์นั้น
 */
export const deleteFileFromStorage = async (url: string) => {
  try {
    const storage = getStorage();
    const decodedUrl = decodeURIComponent(url);

    // Extract path between "/o/" and "?"
    const pathStart = decodedUrl.indexOf('/o/') + 3;
    const pathEnd = decodedUrl.indexOf('?', pathStart);

    if (pathStart === 2 || pathEnd === -1) {
      throw new Error('❌ ไม่สามารถแยก path ได้จาก URL ที่ให้มา');
    }

    const filePath = decodedUrl.substring(pathStart, pathEnd);

    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    console.log('✅ Deleted from Firebase Storage:', filePath);
  } catch (error) {
    console.error('❌ Failed to delete file from Firebase Storage:', error);
  }
}; 
