'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getPetInfo, saveRestoreRequest, getRestoreRequests } from '@/lib/firestore';
import { uploadPhoto } from '@/lib/firebaseStorage';

interface PetInfo {
  name: string;
  photos?: string[];
  [key: string]: any;
}

interface RestoreRequest {
  id: string;
  userId: string;
  petName: string;
  photoUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  animationUrl?: string;
  message?: string;
}

export default function RestorePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [petInfo, setPetInfo] = useState<PetInfo | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [requests, setRequests] = useState<RestoreRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && !authLoading) {
      loadPetInfo();
      loadRestoreRequests();
    }
  }, [user, authLoading, router]);

  const loadPetInfo = async () => {
    if (!user) return;
    try {
      const petData = await getPetInfo(user.uid);
      if (petData) {
        setPetInfo(petData as PetInfo);
        // 첫 번째 사진을 기본 선택
        if (petData.photos && petData.photos.length > 0) {
          setSelectedPhoto(petData.photos[0]);
        }
      } else {
        router.push('/onboarding');
      }
    } catch (error) {
      console.error('펫 정보 불러오기 오류:', error);
    }
  };

  const loadRestoreRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const requestsData = await getRestoreRequests(user.uid);
      setRequests(requestsData as RestoreRequest[]);
    } catch (error) {
      console.error('복원 요청 불러오기 오류:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handlePhotoSelect = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !petInfo) return;

    // 파일 크기 제한 (10MB - 애니메이션용이므로 더 큰 파일 허용)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setUploading(true);
    try {
      const downloadURL = await uploadPhoto(user.uid, file);
      setSelectedPhoto(downloadURL);
    } catch (error: any) {
      console.error('사진 업로드 오류:', error);
      alert(`사진 업로드에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSubmit = () => {
    if (!user || !petInfo || !selectedPhoto) {
      alert('사진을 선택해주세요.');
      return;
    }

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
      
      <div className="max-w-4xl mx-auto py-8 relative z-10">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/chat')}
            className="text-white hover:text-gray-200 transition-colors mb-4 flex items-center drop-shadow-lg"
          >
            ← 채팅으로 돌아가기
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg mb-2">
            ✨ AI 반려동물 복원
          </h1>
          <p className="text-white/90 drop-shadow-lg">
            떠난 아이를 다시 움직이게 만드는 특별한 서비스
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📸 사진 선택</h2>
          
          {/* 기존 사진 선택 */}
          {petInfo.photos && petInfo.photos.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">기존에 업로드한 사진 중 선택:</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {petInfo.photos.map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => handlePhotoSelect(photo)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPhoto === photo
                        ? 'border-purple-500 ring-2 ring-purple-300'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`${petInfo.name} 사진 ${index + 1}`}
                      className="w-full h-24 sm:h-32 object-cover"
                    />
                    {selectedPhoto === photo && (
                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                        <span className="text-white text-2xl">✓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 새 사진 업로드 */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">또는 새 사진 업로드:</p>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
              id="restore-photo-upload"
            />
            <label
              htmlFor="restore-photo-upload"
              className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 transition-colors text-center"
            >
              {uploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500 mr-2"></div>
                  <span className="text-gray-600">업로드 중...</span>
                </div>
              ) : (
                <span className="text-gray-600">📷 사진 선택 (최대 10MB)</span>
              )}
            </label>
          </div>

          {/* 선택된 사진 미리보기 */}
          {selectedPhoto && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">선택된 사진:</p>
              <div className="relative inline-block">
                <img
                  src={selectedPhoto}
                  alt="선택된 사진"
                  className="w-full max-w-md rounded-lg shadow-lg"
                />
              </div>
            </div>
          )}

          {/* 서비스 안내 */}
          <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-purple-800 mb-2">💡 서비스 안내</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• AI 기술을 활용하여 반려동물의 움직임을 복원합니다</li>
              <li>• 관리자가 수동으로 검토 및 처리합니다</li>
              <li>• 처리 완료까지 1-3일이 소요될 수 있습니다</li>
              <li>• 완성된 애니메이션은 채팅 화면에서 사용할 수 있습니다</li>
              <li>• 유료 서비스입니다 (카카오톡에서 가격 문의)</li>
              <li>• 버튼을 클릭하면 카카오톡 오픈채팅으로 이동합니다</li>
            </ul>
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={!selectedPhoto || submitting}
            className="w-full px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '제출 중...' : '✨ 복원 요청 제출'}
          </button>
        </div>

        {/* 요청 내역 */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📋 요청 내역</h2>
          
          {loadingRequests ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아직 요청한 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{request.petName}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : request.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {request.status === 'completed'
                        ? '완료'
                        : request.status === 'processing'
                        ? '처리 중'
                        : request.status === 'failed'
                        ? '실패'
                        : '대기 중'}
                    </span>
                  </div>
                  
                  {request.status === 'completed' && request.animationUrl && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">완성된 애니메이션:</p>
                      <video
                        src={request.animationUrl}
                        controls
                        className="w-full rounded-lg"
                      />
                      <button
                        onClick={() => {
                          // TODO: 애니메이션을 채팅에 적용하는 기능
                          alert('애니메이션이 채팅 화면에 적용되었습니다!');
                        }}
                        className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                      >
                        채팅에 적용하기
                      </button>
                    </div>
                  )}
                  
                  {request.message && (
                    <p className="text-sm text-gray-600 mt-2">{request.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

