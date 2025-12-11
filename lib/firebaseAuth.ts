// Firebase 인증 유틸리티

import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
  Auth
} from 'firebase/auth';
import { auth } from './firebase';

// 카카오톡 인앱 브라우저 감지
const isKakaoTalkInAppBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes('kakaotalk') || userAgent.includes('kakao');
};

// 일반 인앱 브라우저 감지 (카카오톡, 네이버, 라인 등)
const isInAppBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('kakaotalk') ||
    userAgent.includes('kakao') ||
    userAgent.includes('naver') ||
    userAgent.includes('line') ||
    userAgent.includes('instagram') ||
    userAgent.includes('fban') || // Facebook
    userAgent.includes('fbav') // Facebook
  );
};

// Google 로그인 (카카오톡 인앱 브라우저 자동 감지)
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  
  // 카카오톡이나 인앱 브라우저에서는 redirect 사용
  if (isInAppBrowser()) {
    try {
      await signInWithRedirect(auth, provider);
      // redirect는 페이지 이동이므로 여기서 return
      return null;
    } catch (error: any) {
      console.error('Google 로그인 (redirect) 오류:', error);
      throw error;
    }
  } else {
    // 일반 브라우저에서는 popup 사용
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      // popup이 차단된 경우 redirect로 재시도
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, provider);
          return null;
        } catch (redirectError: any) {
          console.error('Google 로그인 (redirect 재시도) 오류:', redirectError);
          throw redirectError;
        }
      }
      console.error('Google 로그인 오류:', error);
      throw error;
    }
  }
};

// 리다이렉트 결과 확인 (로그인 후 돌아왔을 때)
export const getGoogleSignInResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return result.user;
    }
    return null;
  } catch (error: any) {
    console.error('리다이렉트 결과 확인 오류:', error);
    return null;
  }
};

// 로그아웃
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
};

// 인증 상태 변경 감지
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 현재 사용자 가져오기
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

