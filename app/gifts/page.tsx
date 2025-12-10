'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getPetInfo } from '@/lib/firestore';
import { saveGift, getGifts } from '@/lib/firestore';

interface PetInfo {
  name: string;
  userNickname: string;
  personalityType: 'sweet' | 'cool' | 'mature' | 'shy';
  favoriteSnack?: string;
  [key: string]: any;
}

interface Gift {
  id: string;
  type: string;
  message?: string;
  timestamp: Date;
}

const giftTypes = [
  { id: 'sweet-potato', name: '고구마', emoji: '🍠', description: '달콤한 고구마' },
  { id: 'treat', name: '개껌', emoji: '🦴', description: '맛있는 개껌' },
  { id: 'toy', name: '장난감', emoji: '🎾', description: '재밌는 장난감' },
  { id: 'flower', name: '꽃', emoji: '🌸', description: '예쁜 꽃' },
  { id: 'heart', name: '하트', emoji: '💕', description: '사랑의 하트' },
];

export default function GiftsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [petInfo, setPetInfo] = useState<PetInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [response, setResponse] = useState<string>('');
  const [giftHistory, setGiftHistory] = useState<Gift[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && !authLoading) {
      loadPetInfo();
      loadGiftHistory();
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

  const loadGiftHistory = async () => {
    if (!user) return;
    try {
      const gifts = await getGifts(user.uid, 20);
      setGiftHistory(gifts as Gift[]);
    } catch (error) {
      console.error('선물 히스토리 불러오기 오류:', error);
    }
  };

  const handleSendGift = async (giftType: string) => {
    if (!petInfo || !user || isLoading) return;

    setIsLoading(true);
    setSelectedGift(giftType);
    setResponse('');

    try {
      // 선물 저장
      await saveGift(user.uid, {
        type: giftType,
        timestamp: new Date(),
      });

      // AI 응답 생성
      const aiResponse = await fetch('/api/gift-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petInfo, giftType }),
      });

      if (aiResponse.ok) {
        const { response: aiResponseText } = await aiResponse.json();
        setResponse(aiResponseText);
        // 히스토리 새로고침
        await loadGiftHistory();
      } else {
        throw new Error('AI 응답 생성 실패');
      }
    } catch (error: any) {
      console.error('선물 보내기 오류:', error);
      alert('선물 보내기 중 오류가 발생했습니다.');
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

  const selectedGiftInfo = giftTypes.find(g => g.id === selectedGift);

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
              🎁 가상 선물 보내기
            </h1>
            <p className="text-gray-600">
              {petInfo.name}에게 선물을 보내보세요.
            </p>
          </div>

          {/* 선물 선택 */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-3">
              선물 선택
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {giftTypes.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift.id)}
                  disabled={isLoading}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedGift === gift.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-4xl mb-2">{gift.emoji}</div>
                  <div className="text-sm font-medium text-gray-700">{gift.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI 응답 */}
          {response && selectedGiftInfo && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start space-x-3">
                <div className="text-4xl">{selectedGiftInfo.emoji}</div>
                <div className="flex-1">
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
              </div>
            </div>
          )}

          {/* 선물 히스토리 */}
          {giftHistory.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">보낸 선물</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {giftHistory.map((gift) => {
                  const giftInfo = giftTypes.find(g => g.id === gift.type);
                  return (
                    <div
                      key={gift.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-2xl">{giftInfo?.emoji || '🎁'}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {giftInfo?.name || gift.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(gift.timestamp).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

