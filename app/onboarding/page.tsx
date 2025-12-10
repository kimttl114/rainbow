'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { savePetInfo } from '@/lib/firestore';
import { uploadPhoto } from '@/lib/firebaseStorage';

type PersonalityType = 'sweet' | 'cool' | 'mature' | 'shy';

interface PetInfo {
  name: string;
  breed: string;
  age?: string;
  passedDate: string;
  userNickname: string; // 아이가 나를 부르던 호칭
  personalityType: PersonalityType;
  personality: string;
  memories: string;
  favoriteSnack: string; // 가장 좋아했던 간식
  dislikedThing: string; // 싫어했던 것
  frequentBehavior: string; // 자주 했던 행동
  photos?: string[]; // 업로드한 사진들
  backgroundPhoto?: string; // 채팅 배경 사진
}

const personalityTypes = {
  sweet: {
    name: '애교쟁이',
    emoji: '💕',
    example: '형아 사랑해! 꼬리 살랑살랑~',
    description: '항상 사랑을 표현하고 애교가 많은 타입',
  },
  cool: {
    name: '시크/츤데레',
    emoji: '😼',
    example: '밥은 먹었어? 딱히 걱정하는 건 아냐.',
    description: '차분하고 시크하지만 속으로는 따뜻한 타입',
  },
  mature: {
    name: '의젓한 장남',
    emoji: '👑',
    example: '어머니, 너무 슬퍼하지 마세요. 전 괜찮아요.',
    description: '책임감 있고 의젓한 성격의 타입',
  },
  shy: {
    name: '겁쟁이/소심',
    emoji: '🥺',
    example: '누나... 나 없어도 불 켜고 자야 해...',
    description: '소심하지만 따뜻한 마음을 가진 타입',
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PetInfo>({
    name: '',
    breed: '',
    age: '',
    passedDate: '',
    userNickname: '',
    personalityType: 'sweet',
    personality: '',
    memories: '',
    favoriteSnack: '',
    dislikedThing: '',
    frequentBehavior: '',
    photos: [],
    backgroundPhoto: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (field: keyof PetInfo, value: string | PersonalityType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (formData.name && formData.breed && formData.passedDate && formData.userNickname) {
        setStep(2);
      }
    } else if (step === 2) {
      // personality는 선택사항이므로 체크하지 않음
      setStep(3);
    } else if (step === 3) {
      if (formData.memories) {
        setStep(4);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push('/');
    }
  };

  const handleSubmit = async () => {
    if (!formData.favoriteSnack || !formData.dislikedThing || !formData.frequentBehavior) {
      alert('특이사항을 모두 입력해주세요.');
      return;
    }

    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 저장할 데이터 확인 (디버깅용)
      console.log('저장할 펫 정보:', {
        name: formData.name,
        breed: formData.breed,
        age: formData.age,
        passedDate: formData.passedDate,
        userNickname: formData.userNickname,
        personalityType: formData.personalityType,
        personality: formData.personality,
        memories: formData.memories,
        favoriteSnack: formData.favoriteSnack,
        dislikedThing: formData.dislikedThing,
        frequentBehavior: formData.frequentBehavior,
        photosCount: formData.photos?.length || 0,
        backgroundPhoto: formData.backgroundPhoto || '없음',
      });
      
      // Firestore에 저장
      await savePetInfo(user.uid, formData);
      
      // localStorage에도 저장 (임시 호환성)
      localStorage.setItem('petInfo', JSON.stringify(formData));
      
      // 채팅 페이지로 이동
      router.push('/chat');
    } catch (error: any) {
      console.error('펫 정보 저장 오류:', error);
      
      // Firebase 권한 오류인 경우 안내 메시지
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        alert('Firebase 보안 규칙이 설정되지 않았습니다.\n\nFIREBASE_RULES.md 파일을 참고하여 Firebase Console에서 보안 규칙을 설정해주세요.\n\n임시로 localStorage에만 저장합니다.');
        // localStorage에만 저장하고 진행
        router.push('/chat');
      } else {
        alert(`저장에 실패했습니다: ${error.message || '알 수 없는 오류'}\n\n다시 시도해주세요.`);
        setIsSubmitting(false);
      }
    }
  };

  const totalSteps = 4;

  // 로딩 중이거나 로그인되지 않았으면 로딩 화면 표시
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setUploading(true);
    try {
      // Firebase Storage에 직접 업로드 (클라이언트 사이드)
      const downloadURL = await uploadPhoto(user.uid, file);
      
      setFormData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), downloadURL],
      }));
    } catch (error: any) {
      console.error('사진 업로드 오류:', error);
      alert(`사진 업로드에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleBackgroundSelect = (url: string) => {
    setFormData(prev => ({ ...prev, backgroundPhoto: url }));
  };

  const handleRemovePhoto = (url: string) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos?.filter(p => p !== url),
      backgroundPhoto: prev.backgroundPhoto === url ? '' : prev.backgroundPhoto,
    }));
  };

  return (
    <main className="min-h-screen sky-background p-4 relative overflow-hidden">
      {/* 무지개 아치 */}
      <div className="rainbow-arc"></div>
      
      {/* 구름 */}
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      <div className="cloud cloud3"></div>
      
      {/* 별 */}
      <div className="star" style={{ top: '5%', left: '10%', width: '3px', height: '3px', animationDelay: '0s' }}></div>
      <div className="star" style={{ top: '15%', left: '90%', width: '2px', height: '2px', animationDelay: '1s' }}></div>
      <div className="star" style={{ top: '80%', left: '20%', width: '4px', height: '4px', animationDelay: '2s' }}></div>
      
      {/* 천국 빛 */}
      <div className="heaven-light"></div>
      
      <div className="max-w-2xl mx-auto relative z-10">
        {/* 진행 표시 */}
        <div className="mb-8 pt-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              단계 {step} / {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((step / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* 폼 내용 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              🌈 소울 온보딩
            </h1>
            <p className="text-gray-600 italic">
              &ldquo;그곳에서 온 편지, 다시 나누는 이야기&rdquo;
            </p>
            <p className="text-sm text-gray-500 mt-2">
              아이를 기억하는 특별한 의식
            </p>
          </div>

          {/* Step 1: 기본 정보 */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-6">
                <p className="text-gray-700 text-lg">먼저, 아이의 기본 정보를 알려주세요</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="예: 몽이, 뽀삐, 초코..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종류 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => handleInputChange('breed', e.target.value)}
                  placeholder="예: 골든 리트리버, 푸들, 비글..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  나이 (선택)
                </label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="예: 15세, 3살..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  떠난 날짜 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.passedDate}
                  onChange={(e) => handleInputChange('passedDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  아이가 나를 부르던 호칭 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.userNickname}
                  onChange={(e) => handleInputChange('userNickname', e.target.value)}
                  placeholder="예: 엄마, 누나, 형아, 오빠, 아빠..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.name ? `${formData.name}이(가) 당신을 어떻게 불렀나요?` : '아이가 당신을 어떻게 불렀나요?'}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: 말투 성격 */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-6">
                <p className="text-gray-700 text-lg">아이의 말투와 성격을 선택해주세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  말투 성격 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(personalityTypes).map(([key, type]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleInputChange('personalityType', key as PersonalityType)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        formData.personalityType === key
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{type.emoji}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{type.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                          <div className="text-xs text-purple-600 mt-2 italic">
                            &ldquo;{type.example}&rdquo;
                          </div>
                        </div>
                        {formData.personalityType === key && (
                          <span className="text-purple-500">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  추가 성격 설명 (선택)
                </label>
                <textarea
                  value={formData.personality}
                  onChange={(e) => handleInputChange('personality', e.target.value)}
                  placeholder="아이의 성격을 더 자세히 설명해주세요..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: 추억 */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-6">
                <p className="text-gray-700 text-lg">함께했던 소중한 추억을 적어주세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  소중한 추억 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.memories}
                  onChange={(e) => handleInputChange('memories', e.target.value)}
                  placeholder="함께했던 특별한 순간들을 자유롭게 적어주세요..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  이 정보는 AI가 {formData.name || '아이'}의 성격과 말투를 학습하는 데 사용됩니다.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: 특이사항 */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-6">
                <p className="text-gray-700 text-lg">아이만의 특별한 특징들을 알려주세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  가장 좋아했던 간식 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.favoriteSnack}
                  onChange={(e) => handleInputChange('favoriteSnack', e.target.value)}
                  placeholder="예: 고구마, 닭가슴살, 개껌..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  싫어했던 것 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dislikedThing}
                  onChange={(e) => handleInputChange('dislikedThing', e.target.value)}
                  placeholder="예: 오토바이 소리, 비, 혼자 있는 것..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  자주 했던 행동 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.frequentBehavior}
                  onChange={(e) => handleInputChange('frequentBehavior', e.target.value)}
                  placeholder="예: 발라당, 꼬리 흔들기, 손 핥기..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          )}


          {/* 버튼 */}
          <div className="flex justify-between pt-6">
            <button
              onClick={handleBack}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← 이전
            </button>
            {step < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && (!formData.name || !formData.breed || !formData.passedDate || !formData.userNickname)) ||
                  (step === 2 && false) ||
                  (step === 3 && !formData.memories)
                }
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음 →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '저장 중...' : '완료 ✨'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
