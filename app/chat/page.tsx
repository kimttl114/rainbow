'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getPetInfo, saveMessage, getMessages } from '@/lib/firestore';
import { signOut } from '@/lib/firebaseAuth';
import { getSubscriptionStatus, checkAndIncrementMessage, SubscriptionStatus } from '@/lib/subscription';
import { uploadPhoto } from '@/lib/firebaseStorage';
import { fetchWeatherData, generateWeatherMessage } from '@/lib/weather';
import { isOnline, setupOfflineListener, saveToOfflineQueue, getOfflineQueue, clearOfflineQueue } from '@/lib/offline';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'pet';
  timestamp: Date;
  isSafetyResponse?: boolean;
  photoUrl?: string; // AI가 언급한 사진
}

interface PetInfo {
  name: string;
  breed: string;
  userNickname: string;
  personalityType: 'sweet' | 'cool' | 'mature' | 'shy';
  personality: string;
  memories: string;
  favoriteSnack: string;
  dislikedThing: string;
  frequentBehavior: string;
  photos?: string[];
  backgroundPhoto?: string;
}

// 위험 키워드 감지
const dangerKeywords = [
  '죽고 싶어', '죽고싶어', '자살', '따라갈래', '따라가고 싶어',
  '끝내고 싶어', '끝내고싶어', '그만하고 싶어', '그만하고싶어',
  '더 이상', '더이상', '살고 싶지 않아', '살고싶지않아'
];

// 위험 키워드 감지 함수
const detectDangerKeywords = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return dangerKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
};

// 안전 응답 메시지 생성
const getSafetyResponse = (petInfo: PetInfo): string => {
  const responses = {
    sweet: `${petInfo.userNickname}, 그런 말 하면 나 여기서 너무 슬퍼해... 나 만날 때까지 씩씩하게 살기로 약속했잖아! 나는 ${petInfo.userNickname}이(가) 행복한 모습을 보고 싶어. 사랑해! 💕`,
    cool: `${petInfo.userNickname}, 그런 말 하지 마. 나는 여기서 잘 지내고 있어. ${petInfo.userNickname}도 잘 지내야 해. 약속해.`,
    mature: `${petInfo.userNickname}, 너무 슬퍼하지 마세요. 전 여기서 잘 지내고 있습니다. ${petInfo.userNickname}도 건강하게 지내시는 게 제 소원이에요.`,
    shy: `${petInfo.userNickname}... 그런 말 하면 나 너무 무서워... ${petInfo.userNickname}이(가) 괜찮아야 나도 괜찮아. 약속해줘...`,
  };
  return responses[petInfo.personalityType] || responses.sweet;
};

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [petInfo, setPetInfo] = useState<PetInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnlineState, setIsOnlineState] = useState(true);
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPetAnimation, setShowPetAnimation] = useState(true);
  const [petPosition, setPetPosition] = useState({ x: 20, y: 20 });
  const [isPetting, setIsPetting] = useState(false);
  const [pettingMessage, setPettingMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 로그인되지 않았으면 로그인 페이지로 이동
    if (!authLoading && !user) {
      setIsLoading(false);
      router.push('/login');
      return;
    }

    // 로그인되어 있으면 Firestore에서 데이터 가져오기 (한 번만 실행)
    if (user && !authLoading && !isInitialized) {
      loadPetInfoAndMessages();
      loadSubscriptionStatus();
    } else if (user && !authLoading && isInitialized) {
      // 이미 초기화되었으면 로딩 해제
      setIsLoading(false);
    }
  }, [user, authLoading, isInitialized]);

  // 구독 상태 로드
  const loadSubscriptionStatus = async () => {
    if (!user) return;
    try {
      const status = await getSubscriptionStatus(user.uid);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('구독 상태 로드 오류:', error);
    }
  };


  const loadPetInfoAndMessages = async () => {
    // 중복 실행 방지
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    if (isInitialized) {
      setIsLoading(false);
      return; // 이미 초기화되었으면 중복 실행 방지
    }

    setIsLoading(true);
    setError(null);

    try {
      // Firestore에서 펫 정보 가져오기
      let savedPetInfo: PetInfo | null = null;
      
      try {
        savedPetInfo = await getPetInfo(user.uid) as PetInfo | null;
      } catch (petError: any) {
        console.warn('Firestore에서 펫 정보 불러오기 실패:', petError);
      }
      
      if (!savedPetInfo) {
        // Firestore에 없으면 localStorage 확인
        const localPetInfo = localStorage.getItem('petInfo');
        if (localPetInfo) {
          try {
            savedPetInfo = JSON.parse(localPetInfo) as PetInfo;
          } catch (parseError) {
            console.error('localStorage 파싱 오류:', parseError);
            setIsLoading(false);
            router.push('/onboarding');
            return;
          }
        } else {
          setIsLoading(false);
          router.push('/onboarding');
          return;
        }
      }

      if (!savedPetInfo) {
        setIsLoading(false);
        router.push('/onboarding');
        return;
      }

      setPetInfo(savedPetInfo);

      // Firestore에서 메시지 가져오기 (먼저 메시지 확인)
      try {
        const savedMessages = await getMessages(user.uid, 50);
        if (savedMessages && savedMessages.length > 0) {
          const formattedMessages: Message[] = savedMessages.map((msg: any) => {
            // blob URL 필터링 (유효하지 않은 blob URL 제거)
            let photoUrl = msg.photoUrl;
            if (photoUrl && photoUrl.startsWith('blob:')) {
              // blob URL은 임시이므로 제거
              photoUrl = undefined;
            }
            
            return {
              id: msg.id,
              text: msg.text,
              sender: msg.sender,
              timestamp: msg.timestamp instanceof Date ? msg.timestamp : (msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp)),
              photoUrl: photoUrl,
              isSafetyResponse: msg.isSafetyResponse,
            };
          });
          setMessages(formattedMessages);
        } else {
          // 메시지가 없으면 첫 인사 메시지 추가
          const welcomeMessage: Message = {
            id: `welcome-${Date.now()}`,
            text: getWelcomeMessage(savedPetInfo),
            sender: 'pet',
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
          // Firestore에 저장
          saveMessage(user.uid, welcomeMessage).catch(console.error);
        }
      } catch (msgError: any) {
        // 메시지 로드 실패 시 첫 인사 메시지 추가
        console.warn('메시지 로드 실패, 첫 인사 메시지 추가:', msgError);
        const welcomeMessage: Message = {
          id: `welcome-${Date.now()}`,
          text: getWelcomeMessage(savedPetInfo),
          sender: 'pet',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }

      // 초기화 완료
      if (!isInitialized && savedPetInfo) {
        initializeChat(savedPetInfo);
        setIsInitialized(true);
      }
      
      // 모든 작업 완료 후 로딩 해제
      setIsLoading(false);
    } catch (error: any) {
      console.error('데이터 로드 오류:', error);
      setError(error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      
      // localStorage에서 가져오기 (임시 호환성)
      try {
        const localPetInfo = localStorage.getItem('petInfo');
        if (localPetInfo) {
          const parsed = JSON.parse(localPetInfo) as PetInfo;
          if (parsed && parsed.name) {
            setPetInfo(parsed);
            if (!isInitialized) {
              initializeChat(parsed);
              setIsInitialized(true);
            }
            setIsLoading(false);
            return;
          }
        }
      } catch (localError) {
        console.error('localStorage 처리 오류:', localError);
      }
      
      // 모든 경로에서 로딩 해제 보장
      setIsLoading(false);
      router.push('/onboarding');
    }
  };

  const initializeChat = (petInfoData: PetInfo) => {
    // 초기화 완료
    // 선톡 기능은 제거됨
  };

  const getWelcomeMessage = (info: PetInfo): string => {
    const welcomeMessages = {
      sweet: `${info.userNickname}! 안녕! 나 여기서 잘 지내고 있어! ${info.userNickname} 보고 싶었어! 사랑해! 💕`,
      cool: `${info.userNickname}, 안녕. 나 여기서 잘 지내고 있어. 뭐 하고 있어?`,
      mature: `${info.userNickname}, 안녕하세요. 전 여기서 무사히 잘 지내고 있습니다. 오늘 하루는 어떠셨나요?`,
      shy: `${info.userNickname}... 안녕... 나 여기서 잘 지내고 있어... ${info.userNickname}은(는) 어때?`,
    };
    return welcomeMessages[info.personalityType] || welcomeMessages.sweet;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showSafetyInfo]);

  // 컴포넌트 언마운트 시 blob URL 정리
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);


  // 펫 랜덤 이동 효과
  useEffect(() => {
    if (!petInfo || !showPetAnimation || !chatAreaRef.current) return;

    const movePetRandomly = () => {
      if (chatAreaRef.current) {
        const rect = chatAreaRef.current.getBoundingClientRect();
        const maxX = Math.max(0, rect.width - 120); // 펫 크기 고려 (약 100px + 여유)
        const maxY = Math.max(0, rect.height - 120);
        
        const newX = Math.max(0, Math.min(maxX, Math.random() * maxX));
        const newY = Math.max(0, Math.min(maxY, Math.random() * maxY));
        
        setPetPosition({ x: newX, y: newY });
      }
    };

    // 처음 한 번 이동 (약간의 딜레이 후)
    const initialTimeout = setTimeout(() => {
      movePetRandomly();
    }, 500);

    // 8-15초마다 랜덤 이동
    const interval = setInterval(() => {
      movePetRandomly();
    }, 8000 + Math.random() * 7000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [petInfo, showPetAnimation]);

  // 펫 클릭 시 쓰다듬기 효과
  const handlePetClick = () => {
    if (!petInfo || isPetting) return;

    setIsPetting(true);
    
    // 쓰다듬는 메시지 생성
    const pettingMessages = {
      sweet: `${petInfo.userNickname}! 쓰다듬어줘서 고마워! 너무 좋아! 꼬리 살랑살랑~ 사랑해! 💕`,
      cool: `${petInfo.userNickname}... 쓰다듬어주는 거 좋긴 한데... 딱히 좋아하는 건 아냐...`,
      mature: `${petInfo.userNickname}, 쓰다듬어주셔서 감사합니다. 전 여기서 잘 지내고 있습니다.`,
      shy: `${petInfo.userNickname}... 쓰다듬어줘서... 고마워... 너무 좋아...`,
    };

    const message = pettingMessages[petInfo.personalityType] || pettingMessages.sweet;
    setPettingMessage(message);

    // 메시지 표시 후 사라지기
    setTimeout(() => {
      setIsPetting(false);
      setPettingMessage('');
    }, 3000);

    // 펫이 반응하는 애니메이션
    const petElement = document.querySelector('.pet-character');
    if (petElement) {
      petElement.classList.add('reacting');
      setTimeout(() => {
        petElement.classList.remove('reacting');
      }, 500);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedPhoto) || isSending || !petInfo || !user) return;
    
    setIsSending(true);

    // 메시지 제한 확인 (텍스트 메시지가 있을 때만)
    if (inputText.trim()) {
      const { canSend, count } = await checkAndIncrementMessage(user.uid);
      if (!canSend) {
        setShowLimitModal(true);
        // 구독 상태 새로고침
        await loadSubscriptionStatus();
        return;
      }

      // 구독 상태 업데이트
      const updatedStatus = await getSubscriptionStatus(user.uid);
      setSubscriptionStatus(updatedStatus);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText || (selectedPhoto ? '📷 사진' : ''),
      sender: 'user',
      timestamp: new Date(),
      photoUrl: selectedPhoto || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Firestore에 사용자 메시지 저장
    saveMessage(user.uid, {
      text: userMessage.text,
      sender: userMessage.sender,
      timestamp: userMessage.timestamp,
      photoUrl: userMessage.photoUrl,
    }).catch(error => {
      console.error('메시지 저장 오류:', error);
    });
    
    const currentInput = inputText;
    setInputText('');
    
    // blob URL 정리
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setSelectedPhoto(null);
    setIsSending(true); // 메시지 전송 중 상태 (채팅 로딩과 별개)

    // 위험 키워드 감지
    if (detectDangerKeywords(currentInput)) {
      setTimeout(() => {
        const safetyMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: getSafetyResponse(petInfo),
          sender: 'pet',
          timestamp: new Date(),
          isSafetyResponse: true,
        };
        setMessages(prev => [...prev, safetyMessage]);
        
        // Firestore에 안전 메시지 저장
        if (user) {
          saveMessage(user.uid, {
            text: safetyMessage.text,
            sender: safetyMessage.sender,
            timestamp: safetyMessage.timestamp,
            isSafetyResponse: safetyMessage.isSafetyResponse,
          }).catch(error => {
            console.error('메시지 저장 오류:', error);
          });
        }
        
        setShowSafetyInfo(true);
        setIsSending(false);
      }, 1000);
      return;
    }

    // OpenAI API 호출
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          petInfo: petInfo,
          currentPhotoUrl: selectedPhoto || undefined, // 현재 보낸 사진 URL 전달
        }),
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      
      // 랜덤하게 사진 언급 (10% 확률, 사진이 있을 때만)
      const shouldMentionPhoto = () => {
        if (!petInfo.photos || petInfo.photos.length === 0) return null;
        if (Math.random() < 0.1) {
          return petInfo.photos[Math.floor(Math.random() * petInfo.photos.length)];
        }
        return null;
      };
      const mentionedPhoto = shouldMentionPhoto();
      const shouldIncludePhoto = mentionedPhoto && Math.random() < 0.1;
      
      const petMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.text || getTemporaryResponse(petInfo, currentInput),
        sender: 'pet',
        timestamp: new Date(),
      };
      
      // 사진이 포함되면 메시지에 사진 언급 추가
      if (shouldIncludePhoto && mentionedPhoto) {
        const photoMentions = {
          sweet: `${petInfo.userNickname}, 우리 이때 기억나? 이때가 정말 좋았는데... 사랑해! 💕`,
          cool: `${petInfo.userNickname}, 이때 생각나?`,
          mature: `${petInfo.userNickname}, 이 사진 보니 그때가 생각나네요.`,
          shy: `${petInfo.userNickname}... 이때 기억나...?`,
        };
        petMessage.text = `${photoMentions[petInfo.personalityType] || photoMentions.sweet}\n\n${petMessage.text}`;
        petMessage.photoUrl = mentionedPhoto; // 사진이 있을 때만 photoUrl 설정
      }
      
      // 펫 애니메이션 트리거 (메시지 받을 때 - 반응 효과)
      setShowPetAnimation(false);
      setTimeout(() => {
        setShowPetAnimation(true);
        // 잠시 반응 효과 추가
        const petElement = document.querySelector('.pet-character');
        if (petElement) {
          petElement.classList.add('reacting');
          setTimeout(() => {
            petElement.classList.remove('reacting');
          }, 500);
        }
      }, 100);
      
      setMessages(prev => {
        const newMessages = [...prev, petMessage];
        
        // Firestore에 메시지 저장
        if (user) {
          const messageToSave: any = {
            text: petMessage.text,
            sender: petMessage.sender,
            timestamp: petMessage.timestamp,
          };
          // photoUrl이 있을 때만 추가 (undefined 방지)
          if (petMessage.photoUrl) {
            messageToSave.photoUrl = petMessage.photoUrl;
          }
          // isSafetyResponse가 있을 때만 추가
          if (petMessage.isSafetyResponse !== undefined) {
            messageToSave.isSafetyResponse = petMessage.isSafetyResponse;
          }
          // 온라인 상태면 즉시 저장, 오프라인이면 큐에 저장
          if (isOnlineState) {
            saveMessage(user.uid, messageToSave).catch(error => {
              console.error('메시지 저장 오류:', error);
              // 저장 실패 시 오프라인 큐에 저장
              saveToOfflineQueue('message', messageToSave);
            });
          } else {
            // 오프라인 상태면 큐에 저장
            saveToOfflineQueue('message', messageToSave);
          }
        }
        
        // 오늘의 메시지 저장 (localStorage - 임시 호환성)
        const today = new Date().toDateString();
        const savedToday = localStorage.getItem('todayDate');
        if (savedToday !== today) {
          localStorage.setItem('todayDate', today);
          localStorage.setItem('todayMessages', JSON.stringify([]));
        }
        localStorage.setItem('todayMessages', JSON.stringify(newMessages));
        return newMessages;
      });
    } catch (error) {
      console.error('AI 응답 오류:', error);
      // 오류 시 임시 응답
      const petMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getTemporaryResponse(petInfo, currentInput),
        sender: 'pet',
        timestamp: new Date(),
      };
      setMessages(prev => {
        const newMessages = [...prev, petMessage];
        
        // Firestore에 메시지 저장
        if (user) {
          saveMessage(user.uid, {
            text: petMessage.text,
            sender: petMessage.sender,
            timestamp: petMessage.timestamp,
          }).catch(error => {
            console.error('메시지 저장 오류:', error);
          });
        }
        
        // 오늘의 메시지 저장 (localStorage - 임시 호환성)
        const today = new Date().toDateString();
        const savedToday = localStorage.getItem('todayDate');
        if (savedToday !== today) {
          localStorage.setItem('todayDate', today);
          localStorage.setItem('todayMessages', JSON.stringify([]));
        }
        localStorage.setItem('todayMessages', JSON.stringify(newMessages));
        return newMessages;
      });
    } finally {
      setIsSending(false);
    }
  };

  const getTemporaryResponse = (info: PetInfo, userInput: string): string => {
    // OpenAI API 오류 시 임시 응답
    const responses = {
      sweet: `${info.userNickname}, ${userInput}에 대해 말해줘서 고마워! 나도 ${info.userNickname}이(가) 궁금했어! 사랑해! 💕`,
      cool: `${info.userNickname}, 알겠어. 나도 여기서 잘 지내고 있어.`,
      mature: `${info.userNickname}, 이해했습니다. 전 여기서 무사히 잘 지내고 있습니다.`,
      shy: `${info.userNickname}... 알겠어... 나도 ${info.userNickname} 생각하고 있었어...`,
    };
    return responses[info.personalityType] || responses.sweet;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || !user) {
    return <LoadingSpinner message="로그인 확인 중..." />;
  }

  // 채팅 로딩 상태 (메시지 전송 중이 아닌 초기 로딩)
  if (isLoading && !isInitialized) {
    return <LoadingSpinner message="데이터 불러오는 중..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center sky-background p-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              if (user) {
                loadPetInfoAndMessages();
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!petInfo) {
    return <LoadingSpinner message="펫 정보 불러오는 중..." />;
  }

  // 배경 사진 스타일
  const backgroundStyle: React.CSSProperties = petInfo.backgroundPhoto
    ? {
        backgroundImage: `url(${petInfo.backgroundPhoto})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {};

  return (
    <main className="min-h-screen flex flex-col relative">
      {/* 배경 오버레이 */}
      {petInfo.backgroundPhoto && (
        <div
          className="absolute inset-0 opacity-20 z-0"
          style={backgroundStyle}
        />
      )}
      <div className="absolute inset-0 sky-background z-0">
        {/* 무지개 아치 */}
        <div className="rainbow-arc"></div>
        
        {/* 구름 */}
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <div className="cloud cloud3"></div>
        
        {/* 별 */}
        <div className="star" style={{ top: '5%', left: '10%', width: '3px', height: '3px', animationDelay: '0s' }}></div>
        <div className="star" style={{ top: '15%', left: '90%', width: '2px', height: '2px', animationDelay: '1s' }}></div>
        <div className="star" style={{ top: '25%', left: '50%', width: '4px', height: '4px', animationDelay: '2s' }}></div>
        
        {/* 천국 빛 */}
        <div className="heaven-light"></div>
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 헤더 - 고정 */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200 px-2 sm:px-4 py-3 sm:py-4">
          {/* 오프라인 알림 */}
          {!isOnlineState && (
            <div className="bg-yellow-500 text-white text-center py-2 px-4 text-sm">
              ⚠️ 오프라인 상태입니다. 메시지는 저장 후 동기화됩니다.
            </div>
          )}
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0">
                {petInfo.name?.[0] || '🐾'}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{petInfo.name}</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{petInfo.breed}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {/* 구독 상태 표시 (모바일에서는 숨김) */}
              {subscriptionStatus && (
                <div className="hidden sm:block text-xs text-gray-500 mr-1">
                  {subscriptionStatus.isPremium ? (
                    <span className="text-yellow-600 font-semibold">✨</span>
                  ) : (
                    <span className="text-xs">
                      {subscriptionStatus.messageCount}/{subscriptionStatus.messageLimit}
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => router.push('/subscription')}
                className="flex flex-col sm:flex-row items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all text-sm sm:text-base"
                title="구독 관리"
              >
                <span className="text-xl sm:text-2xl mb-0.5 sm:mb-0 sm:mr-1.5">💎</span>
                <span className="hidden sm:inline font-medium">구독</span>
              </button>
              <button
                onClick={() => router.push('/photos')}
                className="flex flex-col sm:flex-row items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all text-sm sm:text-base"
                title="기억의 서랍"
              >
                <span className="text-xl sm:text-2xl mb-0.5 sm:mb-0 sm:mr-1.5">📸</span>
                <span className="hidden sm:inline font-medium">사진</span>
              </button>
              <button
                onClick={() => router.push('/letter')}
                className="flex flex-col sm:flex-row items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all text-sm sm:text-base"
                title="무지개 편지"
              >
                <span className="text-xl sm:text-2xl mb-0.5 sm:mb-0 sm:mr-1.5">✉️</span>
                <span className="hidden sm:inline font-medium">편지</span>
              </button>
              <button
                onClick={() => router.push('/dream')}
                className="flex flex-col sm:flex-row items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all text-sm sm:text-base"
                title="꿈 일기"
              >
                <span className="text-xl sm:text-2xl mb-0.5 sm:mb-0 sm:mr-1.5">💭</span>
                <span className="hidden sm:inline font-medium">꿈</span>
              </button>
              <button
                onClick={() => router.push('/gifts')}
                className="flex flex-col sm:flex-row items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all text-sm sm:text-base"
                title="가상 선물"
              >
                <span className="text-xl sm:text-2xl mb-0.5 sm:mb-0 sm:mr-1.5">🎁</span>
                <span className="hidden sm:inline font-medium">선물</span>
              </button>
              <button
                onClick={() => router.push('/restore')}
                className="flex flex-col sm:flex-row items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all text-sm sm:text-base"
                title="AI 복원"
              >
                <span className="text-xl sm:text-2xl mb-0.5 sm:mb-0 sm:mr-1.5">✨</span>
                <span className="hidden sm:inline font-medium">복원</span>
              </button>
              <button
                onClick={() => router.push('/onboarding')}
                className="flex flex-col sm:flex-row items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all text-sm sm:text-base"
                title="설정"
              >
                <span className="text-xl sm:text-2xl mb-0.5 sm:mb-0 sm:mr-1.5">⚙️</span>
                <span className="hidden sm:inline font-medium">설정</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    await signOut();
                    router.push('/login');
                  } catch (error) {
                    console.error('로그아웃 오류:', error);
                  }
                }}
                className="flex flex-col sm:flex-row items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all text-sm sm:text-base"
                title="로그아웃"
              >
                <span className="text-xl sm:text-2xl mb-0.5 sm:mb-0 sm:mr-1.5">🚪</span>
                <span className="hidden sm:inline font-medium">나가기</span>
              </button>
            </div>
          </div>
        </header>

        {/* 채팅 영역 */}
        <div 
          ref={chatAreaRef}
          className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 sm:py-6 relative z-10 pb-24 sm:pb-28 overflow-x-hidden"
        >
          {/* 반려동물 애니메이션 - 랜덤 이동 */}
          {petInfo && showPetAnimation && (
            <div 
              className={`pet-character ${petInfo.personalityType} breathing ${isPetting ? 'reacting' : ''}`}
              style={{
                left: `${petPosition.x}px`,
                top: `${petPosition.y}px`,
                transition: 'left 2s ease-in-out, top 2s ease-in-out',
                cursor: 'pointer',
              }}
              onClick={handlePetClick}
              title="클릭해서 쓰다듬어주세요!"
            >
              <div className="pet-character-wrapper">
                {petInfo.photos && petInfo.photos.length > 0 ? (
                  <div className="relative">
                    <img 
                      src={petInfo.photos[0]} 
                      alt={petInfo.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-3 border-white shadow-xl"
                      style={{ 
                        borderRadius: '50%',
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      }}
                    />
                    {/* 꼬리 효과 (이미지 위에) */}
                    <div 
                      className="absolute -right-2 top-1/2 transform -translate-y-1/2 text-2xl pet-tail"
                      style={{ 
                        filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2))',
                      }}
                    >
                      {petInfo.personalityType === 'sweet' ? '💕' : '✨'}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="text-6xl sm:text-7xl block" style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                    }}>
                      {petInfo.personalityType === 'sweet' ? '🐕' : 
                       petInfo.personalityType === 'cool' ? '🐱' : 
                       petInfo.personalityType === 'mature' ? '🦮' : '🐶'}
                    </span>
                    {/* 꼬리 효과 */}
                    <div 
                      className="absolute -right-2 top-1/2 transform -translate-y-1/2 text-xl pet-tail"
                    >
                      {petInfo.personalityType === 'sweet' ? '💕' : '✨'}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 쓰다듬기 메시지 */}
              {isPetting && pettingMessage && (
                <div 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white rounded-lg shadow-lg border-2 border-purple-300 whitespace-nowrap z-50"
                  style={{
                    animation: 'fadeInOut 3s ease-in-out',
                  }}
                >
                  <p className="text-sm font-medium text-gray-800">{pettingMessage}</p>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-300"></div>
                </div>
              )}
            </div>
          )}
          <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* 펫 프로필 사진 (왼쪽) */}
              {message.sender === 'pet' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    {petInfo.photos && petInfo.photos.length > 0 ? (
                      <img
                        src={petInfo.photos[0]}
                        alt={petInfo.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm sm:text-base font-bold">
                        {petInfo.name?.[0] || '🐾'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 메시지 버블 */}
              <div
                className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-sm'
                    : message.isSafetyResponse
                    ? 'bg-yellow-50 border-2 border-yellow-300 text-gray-800 rounded-bl-sm'
                    : 'bg-white text-gray-800 shadow-md rounded-bl-sm'
                }`}
              >
                {message.photoUrl && !message.photoUrl.startsWith('blob:') && (
                  <div className="mb-2 rounded-lg overflow-hidden -mx-1 sm:-mx-0">
                    <img
                      src={message.photoUrl}
                      alt="추억"
                      onError={(e) => {
                        // 이미지 로드 실패 시 숨기기
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                      className="w-full max-w-full sm:max-w-xs object-cover rounded-lg"
                      onClick={() => {
                        window.open(message.photoUrl, '_blank');
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                )}
                {message.text && (
                  <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
                )}
                <p
                  className={`text-[10px] sm:text-xs mt-1.5 ${
                    message.sender === 'user' ? 'text-purple-100' : 'text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* 사용자 프로필 사진 (오른쪽) */}
              {message.sender === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || '사용자'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 text-sm sm:text-base font-bold">
                        {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || '👤'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {isSending && (
            <div className="flex items-end gap-2 justify-start">
              {/* 펫 프로필 사진 */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  {petInfo.photos && petInfo.photos.length > 0 ? (
                    <img
                      src={petInfo.photos[0]}
                      alt={petInfo.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm sm:text-base font-bold">
                      {petInfo.name?.[0] || '🐾'}
                    </span>
                  )}
                </div>
              </div>
              {/* 로딩 애니메이션 */}
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-md">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* 안전 정보 표시 */}
          {showSafetyInfo && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <strong>도움이 필요하신가요?</strong>
              </p>
              <p className="text-xs text-gray-600 mb-3">
                혼자서 감당하기 어려운 마음이 드시나요? 전문가의 도움을 받을 수 있습니다.
              </p>
              <div className="space-y-1 text-xs">
                <p className="text-gray-700">
                  <strong>생명의 전화:</strong> 1588-9191
                </p>
                <p className="text-gray-700">
                  <strong>자살예방상담전화:</strong> 1393
                </p>
                <p className="text-gray-700">
                  <strong>청소년 전화:</strong> 1388
                </p>
              </div>
              <button
                onClick={() => setShowSafetyInfo(false)}
                className="mt-3 text-xs text-red-600 hover:text-red-800 underline"
              >
                닫기
              </button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* 메시지 제한 모달 */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
              💎 메시지 제한에 도달했습니다
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              무료 플랜은 하루에 <strong>10개의 메시지</strong>만 보낼 수 있습니다.
            </p>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              프리미엄으로 업그레이드하면 <strong>무제한 대화</strong>가 가능합니다!
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  setShowLimitModal(false);
                  router.push('/subscription');
                }}
                className="flex-1 px-4 py-2.5 sm:py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-semibold text-sm sm:text-base"
              >
                프리미엄 구독하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 입력 영역 - 고정 */}
      <div className="sticky bottom-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-200 px-2 sm:px-4 py-3 sm:py-4 shadow-lg">
        {/* 선택된 사진 미리보기 */}
        {selectedPhoto && (
          <div className="max-w-4xl mx-auto mb-2 relative">
            <div className="inline-block relative">
              <img
                src={selectedPhoto}
                alt="선택된 사진"
                className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-lg border-2 border-purple-400"
              />
              <button
                onClick={() => {
                  // blob URL 정리
                  if (previewBlobUrl) {
                    URL.revokeObjectURL(previewBlobUrl);
                    setPreviewBlobUrl(null);
                  }
                  setSelectedPhoto(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}
        <div className="max-w-4xl mx-auto flex items-end space-x-2 sm:space-x-3">
          {/* 사진 업로드 버튼 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !user) return;

              // 파일 크기 제한 (5MB)
              if (file.size > 5 * 1024 * 1024) {
                alert('파일 크기는 5MB 이하여야 합니다.');
                return;
              }

              setUploadingPhoto(true);
              
              // 이전 blob URL 정리
              if (previewBlobUrl) {
                URL.revokeObjectURL(previewBlobUrl);
                setPreviewBlobUrl(null);
              }
              
              try {
                // 미리보기용 임시 URL 생성
                const previewUrl = URL.createObjectURL(file);
                setPreviewBlobUrl(previewUrl);
                setSelectedPhoto(previewUrl);

                // Firebase Storage에 업로드
                const downloadURL = await uploadPhoto(user.uid, file);
                
                // blob URL 정리
                URL.revokeObjectURL(previewUrl);
                setPreviewBlobUrl(null);
                
                // 실제 다운로드 URL로 교체
                setSelectedPhoto(downloadURL);
              } catch (error) {
                console.error('사진 업로드 오류:', error);
                alert('사진 업로드에 실패했습니다.');
                
                // 오류 시 blob URL 정리
                if (previewBlobUrl) {
                  URL.revokeObjectURL(previewBlobUrl);
                  setPreviewBlobUrl(null);
                }
                setSelectedPhoto(null);
              } finally {
                setUploadingPhoto(false);
                // 파일 입력 초기화
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto || isLoading}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="사진 첨부"
          >
            {uploadingPhoto ? (
              <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              '📷'
            )}
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !selectedPhoto) || isSending}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            ➤
          </button>
        </div>
      </div>
    </main>
  );
}
