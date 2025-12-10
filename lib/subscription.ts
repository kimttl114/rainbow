// 구독 관련 유틸리티

import { getSubscriptionInfo, updateSubscriptionInfo, getTodayMessageCount, incrementMessageCount } from './firestore';

export type PlanType = 'free' | 'premium';

export interface SubscriptionStatus {
  plan: PlanType;
  messageCount: number;
  messageLimit: number;
  canSendMessage: boolean;
  isPremium: boolean;
}

// 무료 플랜: 하루 10개 메시지
const FREE_MESSAGE_LIMIT = 10;
const PREMIUM_MESSAGE_LIMIT = Infinity;

// 구독 상태 가져오기
export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  try {
    const subscription = await getSubscriptionInfo(userId);
    const messageCount = await getTodayMessageCount(userId);
    
    const plan: PlanType = subscription?.plan || 'free';
    const messageLimit = plan === 'premium' ? PREMIUM_MESSAGE_LIMIT : FREE_MESSAGE_LIMIT;
    const canSendMessage = messageCount < messageLimit;
    
    return {
      plan,
      messageCount,
      messageLimit,
      canSendMessage,
      isPremium: plan === 'premium',
    };
  } catch (error) {
    console.error('구독 상태 가져오기 오류:', error);
    // 오류 시 기본값 반환 (무료 플랜)
    return {
      plan: 'free',
      messageCount: 0,
      messageLimit: FREE_MESSAGE_LIMIT,
      canSendMessage: true,
      isPremium: false,
    };
  }
};

// 메시지 전송 가능 여부 확인 및 카운트 증가
export const checkAndIncrementMessage = async (userId: string): Promise<{ canSend: boolean; count: number }> => {
  try {
    const status = await getSubscriptionStatus(userId);
    
    if (!status.canSendMessage) {
      return { canSend: false, count: status.messageCount };
    }
    
    const newCount = await incrementMessageCount(userId);
    return { canSend: true, count: newCount };
  } catch (error) {
    console.error('메시지 전송 확인 오류:', error);
    // 오류 시에도 전송 허용 (사용자 경험 우선)
    return { canSend: true, count: 0 };
  }
};

// 프리미엄으로 업그레이드
export const upgradeToPremium = async (userId: string, expiresAt?: Date) => {
  try {
    const premiumExpiresAt = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 기본 30일
    await updateSubscriptionInfo(userId, {
      plan: 'premium',
      premiumExpiresAt: {
        seconds: Math.floor(premiumExpiresAt.getTime() / 1000),
        nanoseconds: 0,
      } as any,
    });
    return true;
  } catch (error) {
    console.error('프리미엄 업그레이드 오류:', error);
    throw error;
  }
};

// 프리미엄 만료 확인
export const checkPremiumExpiry = async (userId: string): Promise<boolean> => {
  try {
    const subscription = await getSubscriptionInfo(userId);
    if (!subscription || subscription.plan !== 'premium') {
      return false;
    }
    
    if (!subscription.premiumExpiresAt) {
      return true; // 만료일이 없으면 영구 프리미엄으로 간주
    }
    
    const expiresAt = subscription.premiumExpiresAt.toDate();
    const now = new Date();
    
    if (now > expiresAt) {
      // 만료되었으면 무료 플랜으로 변경
      await updateSubscriptionInfo(userId, { plan: 'free' });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('프리미엄 만료 확인 오류:', error);
    return false;
  }
};

