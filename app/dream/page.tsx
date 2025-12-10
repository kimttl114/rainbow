'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getPetInfo } from '@/lib/firestore';
import { saveDream } from '@/lib/firestore';

interface PetInfo {
  name: string;
  userNickname: string;
  personalityType: 'sweet' | 'cool' | 'mature' | 'shy';
  [key: string]: any;
}

export default function DreamPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [petInfo, setPetInfo] = useState<PetInfo | null>(null);
  const [dreamText, setDreamText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && !authLoading) {
      loadPetInfo();
    }
  }, [user, authLoading, router]);

  const loadPetInfo = async () => {
    if (!user) return;
    try {
      const petData = await getPetInfo(user.uid);
      if (petData) {
        setPetInfo(petData as PetInfo);
      } else {
        router.push('/onboarding');
      }
    } catch (error) {
      console.error('펫 정보 불러오기 오류:', error);
    }
  };

  const handleSubmit = async () => {
    if (!dreamText.trim() || !petInfo || !user || isLoading) return;

    setIsLoading(true);
    setResponse('');

    try {
      // 꿈 일기 저장
      await saveDream(user.uid, {
        text: dreamText,
        timestamp: new Date(),
      });

      // AI 응답 생성
      const aiResponse = await fetch('/api/dream-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petInfo, dreamText }),
      });

      if (aiResponse.ok) {
        const { response: aiResponseText } = await aiResponse.json();
        setResponse(aiResponseText);
      } else {
        throw new Error('AI 응답 생성 실패');
      }
    } catch (error: any) {
      console.error('꿈 일기 처리 오류:', error);
      alert('꿈 일기 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user || !petInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center sky-background relative overflow-hidden">
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-medium drop-shadow-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen sky-background p-4 relative overflow-hidden">
      {/* 무지개 아치 */}
      <div className="rainbow-arc"></div>
      
      {/* 구름 */}
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      <div className="cloud cloud3"></div>
      
      {/* 천국 빛 */}
      <div className="heaven-light"></div>
      
      <div className="max-w-2xl mx-auto py-8 relative z-10">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8">
          {/* 헤더 */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/chat')}
              className="text-gray-600 hover:text-gray-800 transition-colors mb-4 flex items-center"
            >
              ← 채팅으로 돌아가기
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              💭 꿈 일기
            </h1>
            <p className="text-gray-600">
              {petInfo.name}이(가) 꿈에 나왔나요? 꿈 이야기를 들려주세요.
            </p>
          </div>

          {/* 꿈 일기 입력 */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              꿈 이야기
            </label>
            <textarea
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder={`${petInfo.name}이(가) 꿈에 나왔던 이야기를 자유롭게 적어주세요...`}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none h-40 text-sm sm:text-base"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!dreamText.trim() || isLoading}
            className="w-full px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isLoading ? '처리 중...' : '꿈 이야기 들려주기 ✨'}
          </button>

          {/* AI 응답 */}
          {response && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {petInfo.name?.[0] || '🐾'}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base">
                    {response}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

