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
    // Storage가 초기화되었는지 확인
    if (!storage) {
      throw new Error('Firebase Storage가 초기화되지 않았습니다. 환경 변수를 확인해주세요.');
    }

    // userId 유효성 검사
    if (!userId || userId.trim() === '') {
      throw new Error('사용자 ID가 유효하지 않습니다.');
    }

    // 파일 유효성 검사
    if (!file || file.size === 0) {
      throw new Error('유효하지 않은 파일입니다.');
    }

    // 파일명 생성 (타임스탬프 + 안전한 파일명)
    const timestamp = Date.now();
    // 파일명에서 특수문자 제거 및 공백을 언더스코어로 변경
    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 100); // 파일명 길이 제한
    const fileName = `${timestamp}-${safeFileName}`;
    
    // Storage 경로 생성
    const storageRef = ref(storage, `users/${userId}/photos/${fileName}`);
    
    // 파일 업로드 (메타데이터 포함)
    const metadata = {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    };
    
    await uploadBytes(storageRef, file, metadata);
    
    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(storageRef);
    
    if (!downloadURL) {
      throw new Error('다운로드 URL을 가져올 수 없습니다.');
    }
    
    return downloadURL;
  } catch (error: any) {
    console.error('사진 업로드 오류:', error);
    
    // Firebase Storage 관련 에러 처리
    if (error.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          throw new Error('업로드 권한이 없습니다. 로그인 상태를 확인해주세요.');
        case 'storage/canceled':
          throw new Error('업로드가 취소되었습니다.');
        case 'storage/unknown':
          throw new Error('알 수 없는 Storage 오류가 발생했습니다.');
        case 'storage/quota-exceeded':
          throw new Error('Storage 용량이 초과되었습니다.');
        case 'storage/unauthenticated':
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        default:
          throw new Error(`업로드 실패: ${error.message || '알 수 없는 오류'}`);
      }
    }
    
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

