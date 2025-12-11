'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    // 카카오톡 인앱 브라우저 최적화: 즉시 리다이렉트
    if (!loading && !redirected) {
      setRedirected(true);
      if (user) {
        // 로그인되어 있으면 채팅 페이지로 이동
        router.replace('/chat');
      } else {
        // 로그인되지 않았으면 로그인 페이지로 이동
        router.replace('/login');
      }
    }
  }, [user, loading, router, redirected]);

  // 카카오톡 인앱 브라우저 최적화: 즉시 리다이렉트 시도
  if (!loading && !redirected) {
    // 빈 화면 대신 즉시 리다이렉트
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center sky-background relative overflow-hidden">
      {/* 무지개 아치 */}
      <div className="rainbow-arc"></div>
      
      {/* 구름 */}
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      <div className="cloud cloud3"></div>
      
      {/* 별 */}
      <div className="star" style={{ top: '15%', left: '20%', width: '4px', height: '4px', animationDelay: '0s' }}></div>
      <div className="star" style={{ top: '25%', left: '60%', width: '3px', height: '3px', animationDelay: '1s' }}></div>
      <div className="star" style={{ top: '40%', left: '80%', width: '5px', height: '5px', animationDelay: '2s' }}></div>
      <div className="star" style={{ top: '60%', left: '30%', width: '3px', height: '3px', animationDelay: '0.5s' }}></div>
      <div className="star" style={{ top: '70%', left: '70%', width: '4px', height: '4px', animationDelay: '1.5s' }}></div>
      
      {/* 천국 빛 */}
      <div className="heaven-light"></div>
      
      <div className="text-center relative z-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-visible-white font-medium">로딩 중...</p>
      </div>
    </main>
  );
}

