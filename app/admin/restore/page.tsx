'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';

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

export default function AdminRestorePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RestoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');

  // 관리자 체크 (실제로는 환경 변수나 Firestore에서 관리자 목록 확인)
  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || 
                  user?.email?.endsWith('@admin.rainbowtalk.com'); // 예시

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && !authLoading) {
      if (!isAdmin) {
        alert('관리자만 접근할 수 있습니다.');
        router.push('/chat');
        return;
      }
      loadAllRequests();
    }
  }, [user, authLoading, router, isAdmin]);

  const loadAllRequests = async () => {
    setLoading(true);
    try {
      // 모든 사용자의 복원 요청 가져오기
      const allRequests: RestoreRequest[] = [];
      
      // 모든 사용자 ID 가져오기 (실제로는 더 효율적인 방법 사용)
      // 여기서는 간단하게 구현
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const requestsRef = collection(db, 'users', userId, 'restoreRequests');
        const q = query(requestsRef, orderBy('createdAt', 'desc'));
        const requestsSnapshot = await getDocs(q);
        
        requestsSnapshot.forEach((doc) => {
          const data = doc.data();
          allRequests.push({
            id: doc.id,
            userId,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate() || undefined,
          } as RestoreRequest);
        });
      }
      
      setRequests(allRequests);
    } catch (error) {
      console.error('복원 요청 불러오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (
    userId: string,
    requestId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    animationUrl?: string,
    message?: string
  ) => {
    try {
      const requestRef = doc(db, 'users', userId, 'restoreRequests', requestId);
      const updateData: any = {
        status,
        message: message || '',
      };
      
      if (status === 'completed' && animationUrl) {
        updateData.animationUrl = animationUrl;
        updateData.completedAt = Timestamp.now();
      } else if (status === 'processing') {
        // 처리 시작
      } else if (status === 'failed') {
        updateData.completedAt = Timestamp.now();
      }
      
      await updateDoc(requestRef, updateData);
      await loadAllRequests();
      alert('상태가 업데이트되었습니다.');
    } catch (error) {
      console.error('상태 업데이트 오류:', error);
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center sky-background relative overflow-hidden">
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-medium drop-shadow-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen sky-background p-4 relative overflow-hidden">
      <div className="max-w-6xl mx-auto py-8 relative z-10">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/chat')}
            className="text-white hover:text-gray-200 transition-colors mb-4 flex items-center drop-shadow-lg"
          >
            ← 채팅으로 돌아가기
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg mb-2">
            🔧 관리자 대시보드 - AI 복원 요청
          </h1>
          <p className="text-white/90 drop-shadow-lg">
            사용자들의 복원 요청을 관리하고 처리하세요
          </p>
        </div>

        {/* 필터 */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              전체 ({requests.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              대기 중 ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('processing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'processing'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              처리 중 ({requests.filter(r => r.status === 'processing').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              완료 ({requests.filter(r => r.status === 'completed').length})
            </button>
          </div>
        </div>

        {/* 요청 목록 */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              요청이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={`${request.userId}-${request.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* 요청 정보 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">{request.petName}</h3>
                          <p className="text-sm text-gray-500">
                            사용자 ID: {request.userId.substring(0, 8)}...
                          </p>
                          <p className="text-sm text-gray-500">
                            요청일: {new Date(request.createdAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
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
                      
                      {/* 사진 */}
                      <div className="mt-3">
                        <img
                          src={request.photoUrl}
                          alt={request.petName}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                      
                      {/* 완성된 애니메이션 */}
                      {request.status === 'completed' && request.animationUrl && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">완성된 애니메이션:</p>
                          <video
                            src={request.animationUrl}
                            controls
                            className="w-full max-w-md rounded-lg"
                          />
                        </div>
                      )}
                      
                      {/* 메시지 */}
                      {request.message && (
                        <p className="text-sm text-gray-600 mt-2">{request.message}</p>
                      )}
                    </div>
                    
                    {/* 액션 버튼 */}
                    <div className="flex flex-col gap-2 sm:min-w-[200px]">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateRequestStatus(request.userId, request.id, 'processing')}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                          >
                            처리 시작
                          </button>
                          <button
                            onClick={() => {
                              const message = prompt('거부 사유를 입력하세요:');
                              if (message) {
                                updateRequestStatus(request.userId, request.id, 'failed', undefined, message);
                              }
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            거부
                          </button>
                        </>
                      )}
                      
                      {request.status === 'processing' && (
                        <>
                          <button
                            onClick={() => {
                              const animationUrl = prompt('완성된 애니메이션 URL을 입력하세요:');
                              const message = prompt('완료 메시지를 입력하세요 (선택사항):');
                              if (animationUrl) {
                                updateRequestStatus(request.userId, request.id, 'completed', animationUrl, message);
                              }
                            }}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                          >
                            완료 처리
                          </button>
                          <button
                            onClick={() => {
                              const message = prompt('실패 사유를 입력하세요:');
                              if (message) {
                                updateRequestStatus(request.userId, request.id, 'failed', undefined, message);
                              }
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            실패 처리
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

