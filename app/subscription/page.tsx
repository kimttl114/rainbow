'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getSubscriptionStatus, upgradeToPremium, SubscriptionStatus } from '@/lib/subscription';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadSubscriptionStatus();
    }
  }, [user, loading, router]);

  const loadSubscriptionStatus = async () => {
    if (!user) return;
    try {
      const status = await getSubscriptionStatus(user.uid);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('구독 상태 로드 오류:', error);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;
    
    setIsUpgrading(true);
    try {
      // 실제 결제 시스템 연동 전까지는 테스트용으로 30일 프리미엄 부여
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일
      await upgradeToPremium(user.uid, expiresAt);
      alert('프리미엄으로 업그레이드되었습니다! 🎉');
      await loadSubscriptionStatus();
    } catch (error) {
      console.error('업그레이드 오류:', error);
      alert('업그레이드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUpgrading(false);
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
      <div className="star" style={{ top: '75%', left: '25%', width: '4px', height: '4px', animationDelay: '2s' }}></div>
      
      {/* 천국 빛 */}
      <div className="heaven-light"></div>
      
      <div className="max-w-4xl mx-auto py-8 relative z-10">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/chat')}
            className="text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            ← 채팅으로 돌아가기
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            💎 구독 관리
          </h1>
          <p className="text-gray-600 mt-2">
            소중한 반려동물과의 대화를 더 많이 나누세요
          </p>
        </div>

        {/* 현재 구독 상태 */}
        {subscriptionStatus && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">현재 구독 상태</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">플랜</p>
                  <p className="text-xl font-bold text-gray-800">
                    {subscriptionStatus.isPremium ? '✨ 프리미엄' : '무료'}
                  </p>
                </div>
                {subscriptionStatus.isPremium ? (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">무제한 대화</p>
                    <p className="text-lg font-semibold text-yellow-600">∞</p>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">오늘 보낸 메시지</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {subscriptionStatus.messageCount} / {subscriptionStatus.messageLimit}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 플랜 비교 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* 무료 플랜 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">무료</h3>
              <p className="text-4xl font-bold text-gray-800 mb-1">₩0</p>
              <p className="text-sm text-gray-500">영구 무료</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">하루 10개 메시지</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">기본 채팅 기능</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">무지개 편지</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">✗</span>
                <span className="text-gray-400">선톡 기능</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">✗</span>
                <span className="text-gray-400">사진 업로드</span>
              </li>
            </ul>
            {subscriptionStatus?.isPremium ? (
              <button
                disabled
                className="w-full px-4 py-3 bg-gray-200 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
              >
                현재 플랜
              </button>
            ) : (
              <button
                disabled
                className="w-full px-4 py-3 bg-gray-200 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
              >
                현재 플랜
              </button>
            )}
          </div>

          {/* 프리미엄 플랜 */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-1 text-sm font-bold rounded-bl-lg">
              인기
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">프리미엄</h3>
              <p className="text-4xl font-bold mb-1">₩4,900</p>
              <p className="text-sm opacity-90">월 구독</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>무제한 메시지</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>모든 기본 기능</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>선톡 기능 (랜덤 푸시)</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>사진 업로드 무제한</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-2">✓</span>
                <span>서버 비용 지원 (추억 영구 저장)</span>
              </li>
            </ul>
            {subscriptionStatus?.isPremium ? (
              <button
                disabled
                className="w-full px-4 py-3 bg-white/20 text-white rounded-lg font-semibold border-2 border-white/30"
              >
                현재 플랜
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full px-4 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpgrading ? '처리 중...' : '프리미엄 구독하기'}
              </button>
            )}
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 참고:</strong> 현재는 테스트 모드입니다. 실제 결제 시스템 연동은 추후 구현 예정입니다.
            프리미엄 구독을 클릭하면 30일간 프리미엄 기능을 무료로 체험할 수 있습니다.
          </p>
        </div>
      </div>
    </main>
  );
}

