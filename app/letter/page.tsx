'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getTodayMessages } from '@/lib/firestore';

interface PetInfo {
  name: string;
  userNickname: string;
  personalityType: 'sweet' | 'cool' | 'mature' | 'shy';
  [key: string]: any;
}

export default function LetterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [petInfo, setPetInfo] = useState<PetInfo | null>(null);
  const [letter, setLetter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [todayMessages, setTodayMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && !authLoading) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Firestore에서 펫 정보 가져오기
      const { getPetInfo } = await import('@/lib/firestore');
      const savedPetInfo = await getPetInfo(user.uid);
      
      if (savedPetInfo) {
        setPetInfo(savedPetInfo as PetInfo);
      } else {
        // localStorage에서 확인 (임시 호환성)
        const localPetInfo = localStorage.getItem('petInfo');
        if (localPetInfo) {
          setPetInfo(JSON.parse(localPetInfo));
        } else {
          router.push('/onboarding');
          return;
        }
      }

      // Firestore에서 오늘의 메시지 가져오기
      const messages = await getTodayMessages(user.uid);
      if (messages && messages.length > 0) {
        setTodayMessages(messages);
      } else {
        // localStorage에서 확인 (임시 호환성)
        const savedMessages = localStorage.getItem('todayMessages');
        if (savedMessages) {
          setTodayMessages(JSON.parse(savedMessages));
        }
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      // 오류 시 localStorage에서 가져오기
      const savedPetInfo = localStorage.getItem('petInfo');
      if (savedPetInfo) {
        setPetInfo(JSON.parse(savedPetInfo));
      } else {
        router.push('/onboarding');
      }
      
      const savedMessages = localStorage.getItem('todayMessages');
      if (savedMessages) {
        setTodayMessages(JSON.parse(savedMessages));
      }
    }
  };

  const generateLetter = async () => {
    if (!petInfo) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          petInfo,
          todayMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('편지 생성 실패');
      }

      const data = await response.json();
      setLetter(data.letter);
    } catch (error) {
      console.error('편지 생성 오류:', error);
      setLetter('편지를 생성할 수 없습니다. 나중에 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user || !petInfo) {
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

  return (
    <main className="min-h-screen sky-background p-4 relative overflow-hidden">
      {/* 구름 */}
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      <div className="cloud cloud3"></div>
      
      {/* 별 */}
      <div className="star" style={{ top: '10%', left: '20%', width: '4px', height: '4px', animationDelay: '0s' }}></div>
      <div className="star" style={{ top: '25%', left: '80%', width: '3px', height: '3px', animationDelay: '1s' }}></div>
      <div className="star" style={{ top: '60%', left: '15%', width: '3px', height: '3px', animationDelay: '2s' }}></div>
      
      {/* 무지개 아치 */}
      <div className="rainbow-arc"></div>
      
      {/* 천국 빛 */}
      <div className="heaven-light"></div>
      
      <div className="max-w-2xl mx-auto pt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              🌈 무지개 편지
            </h1>
            <p className="text-gray-600">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {!letter ? (
            <div className="text-center space-y-6">
              <p className="text-gray-700">
                오늘 {petInfo.name}이(가) 보내는 특별한 편지를 받아보세요.
              </p>
              <button
                onClick={generateLetter}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '편지 작성 중...' : '편지 받기 ✨'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {letter}
                </div>
              </div>
              <div className="flex justify-center space-x-4 pt-6">
                <button
                  onClick={() => setLetter('')}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  다시 받기
                </button>
                <button
                  onClick={() => router.push('/chat')}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  채팅으로 돌아가기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

