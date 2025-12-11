'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getPetInfo } from '@/lib/firestore';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PetInfo {
  name: string;
  photos?: string[];
  [key: string]: any;
}

interface SampleAnimation {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  description?: string;
  createdAt: Date;
}

export default function RestorePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [petInfo, setPetInfo] = useState<PetInfo | null>(null);
  const [sampleAnimations, setSampleAnimations] = useState<SampleAnimation[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && !authLoading) {
      loadPetInfo().catch(console.error);
      loadSampleAnimations().catch(console.error);
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

  const loadSampleAnimations = async () => {
    setLoadingSamples(true);
    try {
      // Firestore에서 샘플 애니메이션 가져오기 (공개 컬렉션)
      const samplesRef = collection(db, 'sampleAnimations');
      const q = query(samplesRef, orderBy('createdAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      
      const samples: SampleAnimation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        samples.push({
          id: doc.id,
          title: data.title || '샘플 애니메이션',
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl,
          description: data.description,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      
      setSampleAnimations(samples);
    } catch (error: any) {
      console.error('샘플 애니메이션 불러오기 오류:', error);
      // 에러가 발생해도 빈 배열로 설정
      setSampleAnimations([]);
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleSubmit = () => {
    // 카카오톡 오픈채팅 링크로 이동
    const kakaoOpenChatUrl = 'https://open.kakao.com/o/s7erXxvh';
    
    // 카카오톡 오픈채팅으로 이동 (새 창에서 열기)
    window.open(kakaoOpenChatUrl, '_blank');
  };

  if (authLoading || !user || !petInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center sky-background relative overflow-hidden">
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-visible-white font-medium">로딩 중...</p>
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
      
      <div className="max-w-4xl mx-auto py-8 relative z-10">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/chat')}
            className="text-visible-white hover:text-gray-200 transition-colors mb-4 flex items-center"
          >
            ← 채팅으로 돌아가기
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-visible-white mb-2">
            ✨ AI 반려동물 복원
          </h1>
          <p className="text-visible-white opacity-90">
            떠난 아이를 다시 움직이게 만드는 특별한 서비스
          </p>
        </div>

        {/* 샘플 애니메이션 섹션 */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">✨ 샘플 애니메이션</h2>
          <p className="text-gray-600 mb-6">
            복원 서비스로 만들어진 샘플 애니메이션을 확인해보세요.
          </p>
          
          {loadingSamples ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">샘플을 불러오는 중...</p>
            </div>
          ) : sampleAnimations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">아직 등록된 샘플이 없습니다.</p>
              <p className="text-sm">곧 업데이트될 예정입니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sampleAnimations.map((sample) => (
                <div
                  key={sample.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {sample.thumbnailUrl ? (
                    <div className="relative w-full aspect-video bg-gray-100">
                      <img
                        src={sample.thumbnailUrl}
                        alt={sample.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="relative w-full aspect-video bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <span className="text-4xl">🎬</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">{sample.title}</h3>
                    {sample.description && (
                      <p className="text-sm text-gray-600 mb-3">{sample.description}</p>
                    )}
                    <video
                      src={sample.videoUrl}
                      controls
                      className="w-full rounded-lg"
                      preload="metadata"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 서비스 안내 및 요청 버튼 */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-purple-800 mb-2">💡 서비스 안내</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• AI 기술을 활용하여 반려동물의 움직임을 복원합니다</li>
              <li>• 관리자가 수동으로 검토 및 처리합니다</li>
              <li>• 처리 완료까지 1-3일이 소요될 수 있습니다</li>
              <li>• 유료 서비스입니다 (카카오톡에서 가격 문의)</li>
              <li>• 버튼을 클릭하면 카카오톡 오픈채팅으로 이동합니다</li>
            </ul>
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            className="w-full px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            💬 카카오톡으로 복원 요청하기
          </button>
        </div>
      </div>
    </main>
  );
}

