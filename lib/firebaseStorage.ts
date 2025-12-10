// Firebase Storage 유틸리티 (사진 업로드)

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  FirebaseStorage
} from 'firebase/storage';
import { storage } from './firebase';

// 사진 업로드
export const uploadPhoto = async (userId: string, file: File): Promise<string> => {
  try {
    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const storageRef = ref(storage, `users/${userId}/photos/${fileName}`);
    
    // 파일 업로드
    await uploadBytes(storageRef, file);
    
    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    console.error('사진 업로드 오류:', error);
    throw error;
  }
};

// 사진 삭제
export const deletePhoto = async (userId: string, fileName: string) => {
  try {
    const storageRef = ref(storage, `users/${userId}/photos/${fileName}`);
    await deleteObject(storageRef);
    return true;
  } catch (error: any) {
    console.error('사진 삭제 오류:', error);
    throw error;
  }
};

// URL에서 파일명 추출
export const getFileNameFromURL = (url: string): string => {
  try {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1].split('?')[0];
    return fileName;
  } catch (error) {
    return '';
  }
};

