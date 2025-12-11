'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getPetInfo, savePetInfo } from '@/lib/firestore';
import { uploadPhoto } from '@/lib/firebaseStorage';

interface PetInfo {
  name: string;
  photos?: string[];
  backgroundPhoto?: string;
  [key: string]: any;
}

export default function PhotosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [petInfo, setPetInfo] = useState<PetInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && !loading) {
      loadPetInfo();
    }
  }, [user, loading, router]);

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
      // localStorage에서 확인
      const localPetInfo = localStorage.getItem('petInfo');
      if (localPetInfo) {
        setPetInfo(JSON.parse(localPetInfo));
      } else {
        router.push('/onboarding');
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // 기본 검증
    if (!file) {
      return;
    }

    if (!user) {
      alert('로그인이 필요합니다. 다시 로그인해주세요.');
      router.push('/login');
      return;
    }

    if (!petInfo) {
      alert('반려동물 정보를 먼저 입력해주세요.');
      router.push('/onboarding');
      return;
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    setUploading(true);
    try {
      // Firebase Storage에 업로드
      const downloadURL = await uploadPhoto(user.uid, file);
      
      if (!downloadURL) {
        throw new Error('업로드된 파일의 URL을 가져올 수 없습니다.');
      }
      
      const updatedPhotos = [...(petInfo.photos || []), downloadURL];
      const updatedPetInfo = {
        ...petInfo,
        photos: updatedPhotos,
        // 첫 사진이면 자동으로 배경으로 설정
        backgroundPhoto: petInfo.backgroundPhoto || downloadURL,
      };
      
      setPetInfo(updatedPetInfo);
      
      // Firestore에 저장
      await savePetInfo(user.uid, updatedPetInfo);
      
      // localStorage에도 저장
      localStorage.setItem('petInfo', JSON.stringify(updatedPetInfo));
    } catch (error: any) {
      console.error('사진 업로드 오류:', error);
      const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
      alert(`사진 업로드에 실패했습니다: ${errorMessage}`);
    } finally {
      setUploading(false);
      // 파일 입력 초기화
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleBackgroundSelect = async (url: string) => {
    if (!user || !petInfo) return;
    
    setSaving(true);
    try {
      const updatedPetInfo = {
        ...petInfo,
        backgroundPhoto: url,
      };
      
      setPetInfo(updatedPetInfo);
      
      // Firestore에 저장
      await savePetInfo(user.uid, updatedPetInfo);
      
      // localStorage에도 저장
      localStorage.setItem('petInfo', JSON.stringify(updatedPetInfo));
      
      alert('배경 사진이 설정되었습니다!');
    } catch (error: any) {
      console.error('배경 사진 설정 오류:', error);
      alert('배경 사진 설정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = async (url: string) => {
    if (!user || !petInfo) return;
    
    if (!confirm('이 사진을 삭제하시겠습니까?')) return;
    
    setSaving(true);
    try {
      const updatedPhotos = petInfo.photos?.filter(p => p !== url) || [];
      
      const updatedPetInfo = {
        ...petInfo,
        photos: updatedPhotos,
        // 삭제한 사진이 배경이었으면 첫 번째 사진으로 변경
        backgroundPhoto: petInfo.backgroundPhoto === url 
          ? (updatedPhotos[0] || '')
          : petInfo.backgroundPhoto,
      };
      
      setPetInfo(updatedPetInfo);
      
      // Firestore에 저장
      await savePetInfo(user.uid, updatedPetInfo);
      
      // localStorage에도 저장
      localStorage.setItem('petInfo', JSON.stringify(updatedPetInfo));
    } catch (error: any) {
      console.error('사진 삭제 오류:', error);
      alert('사진 삭제에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
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

  if (!petInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center sky-background relative overflow-hidden">
        {/* 구름 */}
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        
        {/* 천국 빛 */}
        <div className="heaven-light"></div>
        
        <div className="text-center relative z-10">
          <p className="text-gray-700 mb-4 font-medium">펫 정보를 불러올 수 없습니다.</p>
          <button
            onClick={() => router.push('/onboarding')}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            온보딩으로 이동
          </button>
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
      
      {/* 별 */}
      <div className="star" style={{ top: '8%', left: '15%', width: '3px', height: '3px', animationDelay: '0s' }}></div>
      <div className="star" style={{ top: '20%', left: '85%', width: '2px', height: '2px', animationDelay: '1s' }}></div>
      <div className="star" style={{ top: '70%', left: '30%', width: '4px', height: '4px', animationDelay: '2s' }}></div>
      
      {/* 천국 빛 */}
      <div className="heaven-light"></div>
      
      <div className="max-w-4xl mx-auto py-8 relative z-10">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/chat')}
            className="text-gray-600 hover:text-gray-800 transition-colors mb-4 flex items-center"
          >
            ← 채팅으로 돌아가기
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            📸 기억의 서랍
          </h1>
          <p className="text-gray-600">
            {petInfo.name}와(과) 함께했던 소중한 추억의 사진들을 관리하세요
          </p>
        </div>

        {/* 사진 업로드 영역 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">사진 업로드</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                  <span className="text-gray-600">업로드 중...</span>
                </>
              ) : (
                <>
                  <span className="text-5xl mb-4">📷</span>
                  <span className="text-lg text-gray-700 font-medium mb-2">
                    클릭하여 사진 업로드
                  </span>
                  <span className="text-sm text-gray-500">
                    최대 5MB, 이미지 파일만 가능
                  </span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* 업로드된 사진 목록 */}
        {petInfo.photos && petInfo.photos.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                업로드된 사진 ({petInfo.photos.length}장)
              </h2>
              {petInfo.backgroundPhoto && (
                <span className="text-sm text-purple-600 font-medium">
                  ✓ 배경 사진 설정됨
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {petInfo.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={photo}
                      alt={`추억 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* 배경 사진 표시 */}
                  {petInfo.backgroundPhoto === photo && (
                    <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      배경
                    </div>
                  )}
                  {/* 호버 시 버튼 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleBackgroundSelect(photo)}
                        disabled={saving}
                        className={`px-3 py-2 text-sm rounded ${
                          petInfo.backgroundPhoto === photo
                            ? 'bg-purple-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-purple-100'
                        } transition-colors disabled:opacity-50`}
                      >
                        {petInfo.backgroundPhoto === photo ? '✓ 배경' : '배경 설정'}
                      </button>
                      <button
                        onClick={() => handleRemovePhoto(photo)}
                        disabled={saving}
                        className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {saving && (
              <div className="mt-4 text-center text-sm text-gray-500">
                저장 중...
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <span className="text-6xl mb-4 block">📷</span>
            <p className="text-gray-600 mb-2">아직 업로드된 사진이 없습니다</p>
            <p className="text-sm text-gray-500">
              위의 업로드 영역을 클릭하여 첫 번째 사진을 업로드해보세요
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

