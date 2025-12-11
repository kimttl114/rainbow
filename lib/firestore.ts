// Firestore 데이터베이스 유틸리티

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { db } from './firebase';

// 펫 정보 저장
export const savePetInfo = async (userId: string, petInfo: any) => {
  try {
    const petRef = doc(db, 'users', userId, 'pets', 'current');
    
    // 모든 필드를 명시적으로 저장 (undefined 값 제거)
    const dataToSave: any = {
      // 기본 정보
      name: petInfo.name || '',
      breed: petInfo.breed || '',
      age: petInfo.age || '',
      passedDate: petInfo.passedDate || '',
      userNickname: petInfo.userNickname || '',
      
      // 성격 정보
      personalityType: petInfo.personalityType || 'sweet',
      personality: petInfo.personality || '',
      
      // 추억
      memories: petInfo.memories || '',
      
      // 특이사항
      favoriteSnack: petInfo.favoriteSnack || '',
      dislikedThing: petInfo.dislikedThing || '',
      frequentBehavior: petInfo.frequentBehavior || '',
      
      // 사진 정보
      photos: petInfo.photos && Array.isArray(petInfo.photos) ? petInfo.photos : [],
      backgroundPhoto: petInfo.backgroundPhoto || '',
      // 사진 분석 결과 (photoUrl -> analysis 매핑)
      photoAnalyses: petInfo.photoAnalyses || {},
      
      // 메타데이터
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    await setDoc(petRef, dataToSave);
    console.log('펫 정보 저장 완료:', {
      name: dataToSave.name,
      breed: dataToSave.breed,
      photosCount: dataToSave.photos.length,
      hasBackgroundPhoto: !!dataToSave.backgroundPhoto,
    });
    return true;
  } catch (error: any) {
    console.error('펫 정보 저장 오류:', error);
    throw error;
  }
};

// 펫 정보 가져오기
export const getPetInfo = async (userId: string) => {
  try {
    const petRef = doc(db, 'users', userId, 'pets', 'current');
    const petSnap = await getDoc(petRef);
    
    if (petSnap.exists()) {
      return petSnap.data();
    }
    return null;
  } catch (error: any) {
    console.error('펫 정보 가져오기 오류:', error);
    throw error;
  }
};

// 메시지 저장
export const saveMessage = async (userId: string, message: any) => {
  try {
    const messagesRef = collection(db, 'users', userId, 'messages');
    const messageRef = doc(messagesRef);
    
    // undefined 값 제거 (Firestore는 undefined를 허용하지 않음)
    const cleanMessage: any = {
      text: message.text,
      sender: message.sender,
      timestamp: Timestamp.now(),
    };
    
    // photoUrl이 있으면 추가 (undefined가 아닐 때만)
    if (message.photoUrl !== undefined && message.photoUrl !== null) {
      cleanMessage.photoUrl = message.photoUrl;
    }
    
    // isSafetyResponse가 있으면 추가
    if (message.isSafetyResponse !== undefined) {
      cleanMessage.isSafetyResponse = message.isSafetyResponse;
    }
    
    await setDoc(messageRef, cleanMessage);
    return messageRef.id;
  } catch (error: any) {
    console.error('메시지 저장 오류:', error);
    throw error;
  }
};

// 메시지 목록 가져오기
export const getMessages = async (userId: string, limitCount: number = 50) => {
  try {
    const messagesRef = collection(db, 'users', userId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const messages: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      });
    });
    
    return messages.reverse(); // 시간순으로 정렬
  } catch (error: any) {
    console.error('메시지 가져오기 오류:', error);
    throw error;
  }
};

// 오늘의 메시지 가져오기
export const getTodayMessages = async (userId: string) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    
    const messagesRef = collection(db, 'users', userId, 'messages');
    const q = query(
      messagesRef, 
      where('timestamp', '>=', todayTimestamp),
      orderBy('timestamp', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    const messages: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      });
    });
    
    return messages;
  } catch (error: any) {
    console.error('오늘의 메시지 가져오기 오류:', error);
    throw error;
  }
};

// 사용자 구독 정보 인터페이스
export interface SubscriptionInfo {
  plan: 'free' | 'premium';
  messageCount: number; // 오늘 보낸 메시지 수
  lastResetDate: string; // 마지막 리셋 날짜 (YYYY-MM-DD)
  premiumExpiresAt?: Timestamp; // 프리미엄 만료일 (프리미엄인 경우)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 사용자 구독 정보 가져오기
export const getSubscriptionInfo = async (userId: string): Promise<SubscriptionInfo | null> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.subscription) {
        return data.subscription as SubscriptionInfo;
      }
    }
    
    // 구독 정보가 없으면 기본값 반환
    return null;
  } catch (error: any) {
    console.error('구독 정보 가져오기 오류:', error);
    throw error;
  }
};

// 사용자 구독 정보 저장/업데이트
export const updateSubscriptionInfo = async (
  userId: string, 
  updates: Partial<SubscriptionInfo>
) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    let subscription: SubscriptionInfo;
    
    if (userDoc.exists() && userDoc.data().subscription) {
      // 기존 구독 정보 업데이트
      const existing = userDoc.data().subscription as SubscriptionInfo;
      
      // 날짜가 바뀌었으면 메시지 카운트 리셋
      if (existing.lastResetDate !== today) {
        subscription = {
          ...existing,
          ...updates,
          messageCount: updates.messageCount || 0,
          lastResetDate: today,
          updatedAt: Timestamp.now(),
        };
      } else {
        subscription = {
          ...existing,
          ...updates,
          updatedAt: Timestamp.now(),
        };
      }
    } else {
      // 새 구독 정보 생성
      subscription = {
        plan: 'free',
        messageCount: 0,
        lastResetDate: today,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...updates,
      };
    }
    
    await updateDoc(userDocRef, { subscription });
    return subscription;
  } catch (error: any) {
    console.error('구독 정보 업데이트 오류:', error);
    throw error;
  }
};

// 오늘 보낸 메시지 수 가져오기
export const getTodayMessageCount = async (userId: string): Promise<number> => {
  try {
    const subscription = await getSubscriptionInfo(userId);
    if (!subscription) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    if (subscription.lastResetDate !== today) {
      // 날짜가 바뀌었으면 0으로 리셋
      await updateSubscriptionInfo(userId, { messageCount: 0, lastResetDate: today });
      return 0;
    }
    
    return subscription.messageCount || 0;
  } catch (error: any) {
    console.error('오늘의 메시지 수 가져오기 오류:', error);
    return 0;
  }
};

// 메시지 카운트 증가
export const incrementMessageCount = async (userId: string) => {
  try {
    const currentCount = await getTodayMessageCount(userId);
    await updateSubscriptionInfo(userId, { messageCount: currentCount + 1 });
    return currentCount + 1;
  } catch (error: any) {
    console.error('메시지 카운트 증가 오류:', error);
    throw error;
  }
};

// 꿈 일기 저장
export const saveDream = async (userId: string, dream: { text: string; timestamp: Date }) => {
  try {
    const dreamsRef = collection(db, 'users', userId, 'dreams');
    const dreamRef = doc(dreamsRef);
    
    await setDoc(dreamRef, {
      text: dream.text,
      timestamp: Timestamp.fromDate(dream.timestamp),
      createdAt: Timestamp.now(),
    });
    
    return dreamRef.id;
  } catch (error: any) {
    console.error('꿈 일기 저장 오류:', error);
    throw error;
  }
};

// 가상 선물 히스토리 저장
export const saveGift = async (userId: string, gift: { type: string; message?: string; timestamp: Date }) => {
  try {
    const giftsRef = collection(db, 'users', userId, 'gifts');
    const giftRef = doc(giftsRef);
    
    await setDoc(giftRef, {
      type: gift.type,
      message: gift.message || '',
      timestamp: Timestamp.fromDate(gift.timestamp),
      createdAt: Timestamp.now(),
    });
    
    return giftRef.id;
  } catch (error: any) {
    console.error('선물 저장 오류:', error);
    throw error;
  }
};

// 선물 히스토리 가져오기
export const getGifts = async (userId: string, limitCount: number = 50) => {
  try {
    const giftsRef = collection(db, 'users', userId, 'gifts');
    const q = query(giftsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const gifts: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      gifts.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      });
    });
    
    return gifts;
  } catch (error: any) {
    console.error('선물 히스토리 불러오기 오류:', error);
    throw error;
  }
};

// AI 복원 요청 저장
export const saveRestoreRequest = async (userId: string, request: {
  petName: string;
  photoUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}) => {
  try {
    const requestsRef = collection(db, 'users', userId, 'restoreRequests');
    const requestRef = doc(requestsRef);
    
    await setDoc(requestRef, {
      ...request,
      createdAt: Timestamp.now(),
    });
    
    return requestRef.id;
  } catch (error: any) {
    console.error('복원 요청 저장 오류:', error);
    throw error;
  }
};

// AI 복원 요청 목록 가져오기
export const getRestoreRequests = async (userId: string) => {
  try {
    const requestsRef = collection(db, 'users', userId, 'restoreRequests');
    
    // 인덱스 오류를 방지하기 위해 orderBy 없이 먼저 시도
    let querySnapshot;
    try {
      const q = query(requestsRef, orderBy('createdAt', 'desc'));
      querySnapshot = await getDocs(q);
    } catch (indexError: any) {
      // 인덱스 오류인 경우 orderBy 없이 가져오기
      console.warn('Firestore 인덱스 오류, orderBy 없이 가져옵니다:', indexError);
      querySnapshot = await getDocs(requestsRef);
    }
    
    const requests: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate() || undefined,
      });
    });
    
    // 클라이언트 사이드에서 정렬 (인덱스가 없는 경우)
    requests.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return dateB - dateA; // 내림차순
    });
    
    return requests;
  } catch (error: any) {
    console.error('복원 요청 목록 불러오기 오류:', error);
    // 에러가 발생해도 빈 배열 반환 (페이지가 렌더링되도록)
    return [];
  }
};

// 총 이용객 수 가져오기
export const getTotalUserCount = async (): Promise<number> => {
  try {
    const statsRef = doc(db, 'stats', 'users');
    const statsSnap = await getDoc(statsRef);
    
    if (statsSnap.exists()) {
      return statsSnap.data().totalCount || 0;
    }
    return 0;
  } catch (error: any) {
    console.error('이용객 수 가져오기 오류:', error);
    return 0;
  }
};

// 이용객 수 증가 (온보딩 완료 시 호출)
export const incrementUserCount = async (): Promise<number> => {
  try {
    const statsRef = doc(db, 'stats', 'users');
    const statsSnap = await getDoc(statsRef);
    
    let newCount: number;
    if (statsSnap.exists()) {
      const currentCount = statsSnap.data().totalCount || 0;
      newCount = currentCount + 1;
      await updateDoc(statsRef, {
        totalCount: newCount,
        updatedAt: Timestamp.now(),
      });
    } else {
      newCount = 1;
      await setDoc(statsRef, {
        totalCount: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    
    return newCount;
  } catch (error: any) {
    console.error('이용객 수 증가 오류:', error);
    return 0;
  }
};


