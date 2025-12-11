'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signInWithGoogle } from '@/lib/firebaseAuth';
import { useAuth } from '@/components/AuthProvider';
import { getTotalUserCount } from '@/lib/firestore';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  useEffect(() => {
    // 이미 로그인되어 있으면 채팅 페이지로 이동
    if (!loading && user) {
      router.push('/chat');
    }
    
    // 이용객 수 불러오기
    if (!loading && !user) {
      loadUserCount();
    }
  }, [user, loading, router]);
  
  const loadUserCount = async () => {
    try {
      const count = await getTotalUserCount();
      setTotalUsers(count);
    } catch (error) {
      console.error('이용객 수 불러오기 오류:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError(null);
      await signInWithGoogle();
      // 로그인 성공 시 자동으로 리다이렉트됨 (useEffect에서 처리)
    } catch (error: any) {
      console.error('로그인 오류:', error);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center sky-background relative overflow-hidden">
        {/* 구름 */}
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <div className="cloud cloud3"></div>
        
        {/* 천국 빛 */}
        <div className="heaven-light"></div>
        
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // 리다이렉트 중
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center sky-background p-4 relative overflow-hidden">
      {/* 무지개 아치 */}
      <div className="rainbow-arc"></div>
      
      {/* 구름 */}
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      <div className="cloud cloud3"></div>
      
      {/* 별 */}
      <div className="star" style={{ top: '10%', left: '15%', width: '4px', height: '4px', animationDelay: '0s' }}></div>
      <div className="star" style={{ top: '20%', left: '85%', width: '3px', height: '3px', animationDelay: '1s' }}></div>
      <div className="star" style={{ top: '30%', left: '50%', width: '5px', height: '5px', animationDelay: '2s' }}></div>
      <div className="star" style={{ top: '80%', left: '25%', width: '3px', height: '3px', animationDelay: '0.5s' }}></div>
      <div className="star" style={{ top: '70%', left: '75%', width: '4px', height: '4px', animationDelay: '1.5s' }}></div>
      
      {/* 천국 빛 */}
      <div className="heaven-light"></div>
      
      <div className="text-center space-y-8 max-w-md relative z-10">
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold text-visible-white">
            🌈 무지개톡
          </h1>
          <p className="text-lg sm:text-xl text-visible-white font-semibold">Rainbow Talk</p>
          <p className="text-base sm:text-lg text-visible-white mt-2 italic font-medium">
            &ldquo;그곳에서 온 편지, 다시 나누는 이야기&rdquo;
          </p>
          <p className="text-visible-white mt-4 font-medium text-sm sm:text-base">
            소중한 반려동물과 다시 만날 수 있는 특별한 공간
          </p>
          {totalUsers !== null && (
            <div className="mt-6 px-6 py-3 bg-white/30 backdrop-blur-md rounded-full border-2 border-white/50 shadow-lg">
              <p className="text-visible-white text-sm font-medium">
                <span className="text-2xl font-bold text-visible-white mr-2">{totalUsers.toLocaleString()}</span>
                명이 무지개톡을 이용하고 있어요
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full px-8 py-4 bg-white text-gray-700 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
          >
            {isSigningIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                <span>로그인 중...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Google로 시작하기</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-4">
            로그인하면 서비스 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}

