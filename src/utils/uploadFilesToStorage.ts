import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { UploadFile } from 'antd/es/upload/interface';
import { v4 as uuidv4 } from 'uuid';
import type { FileData } from '@/types/scopeOfWork';
import { storage } from '@/services/firebase'; // ✅ จุดนี้ ok ถ้าคุณ export storage จาก firebase.ts

export const uploadFilesToStorage = async (
  files: UploadFile[],
  pathPrefix: string
): Promise<FileData[]> => {
  const uploaded: FileData[] = [];

  for (const file of files) {
    if (!file.originFileObj || !(file.originFileObj instanceof Blob)) continue;

    const uniqueName = `${uuidv4()}_${file.name}`;
    const fileRef = ref(storage, `${pathPrefix}/${uniqueName}`);
    await uploadBytes(fileRef, file.originFileObj);
    const url = await getDownloadURL(fileRef);

    uploaded.push({ name: file.name, url });
  }

  return uploaded;
};
