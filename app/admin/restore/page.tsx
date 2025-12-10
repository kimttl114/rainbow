'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, getDocs, updateDoc, doc, query, orderBy, where, addDoc, deleteDoc } from 'firebase/firestore';
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

interface SampleAnimation {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  description?: string;
  createdAt: Date;
}

export default function AdminRestorePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RestoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');
  const [sampleAnimations, setSampleAnimations] = useState<SampleAnimation[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [showSampleForm, setShowSampleForm] = useState(false);
  const [editingSample, setEditingSample] = useState<SampleAnimation | null>(null);
  const [sampleForm, setSampleForm] = useState({
    title: '',
    videoUrl: '',
    thumbnailUrl: '',
    description: '',
  });

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
      loadSampleAnimations();
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

  const loadSampleAnimations = async () => {
    setLoadingSamples(true);
    try {
      const samplesRef = collection(db, 'sampleAnimations');
      const q = query(samplesRef, orderBy('createdAt', 'desc'));
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
    } catch (error) {
      console.error('샘플 애니메이션 불러오기 오류:', error);
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleAddSample = async () => {
    if (!sampleForm.title || !sampleForm.videoUrl) {
      alert('제목과 비디오 URL은 필수입니다.');
      return;
    }

    try {
      const samplesRef = collection(db, 'sampleAnimations');
      await addDoc(samplesRef, {
        title: sampleForm.title,
        videoUrl: sampleForm.videoUrl,
        thumbnailUrl: sampleForm.thumbnailUrl || '',
        description: sampleForm.description || '',
        createdAt: Timestamp.now(),
      });
      
      alert('샘플 애니메이션이 추가되었습니다.');
      setSampleForm({ title: '', videoUrl: '', thumbnailUrl: '', description: '' });
      setShowSampleForm(false);
      loadSampleAnimations();
    } catch (error) {
      console.error('샘플 추가 오류:', error);
      alert('샘플 추가에 실패했습니다.');
    }
  };

  const handleEditSample = async () => {
    if (!editingSample || !sampleForm.title || !sampleForm.videoUrl) {
      alert('제목과 비디오 URL은 필수입니다.');
      return;
    }

    try {
      const sampleRef = doc(db, 'sampleAnimations', editingSample.id);
      await updateDoc(sampleRef, {
        title: sampleForm.title,
        videoUrl: sampleForm.videoUrl,
        thumbnailUrl: sampleForm.thumbnailUrl || '',
        description: sampleForm.description || '',
      });
      
      alert('샘플 애니메이션이 수정되었습니다.');
      setEditingSample(null);
      setSampleForm({ title: '', videoUrl: '', thumbnailUrl: '', description: '' });
      setShowSampleForm(false);
      loadSampleAnimations();
    } catch (error) {
      console.error('샘플 수정 오류:', error);
      alert('샘플 수정에 실패했습니다.');
    }
  };

  const handleDeleteSample = async (sampleId: string) => {
    if (!confirm('정말 이 샘플을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const sampleRef = doc(db, 'sampleAnimations', sampleId);
      await deleteDoc(sampleRef);
      alert('샘플 애니메이션이 삭제되었습니다.');
      loadSampleAnimations();
    } catch (error) {
      console.error('샘플 삭제 오류:', error);
      alert('샘플 삭제에 실패했습니다.');
    }
  };

  const openEditForm = (sample: SampleAnimation) => {
    setEditingSample(sample);
    setSampleForm({
      title: sample.title,
      videoUrl: sample.videoUrl,
      thumbnailUrl: sample.thumbnailUrl || '',
      description: sample.description || '',
    });
    setShowSampleForm(true);
  };

  const cancelForm = () => {
    setShowSampleForm(false);
    setEditingSample(null);
    setSampleForm({ title: '', videoUrl: '', thumbnailUrl: '', description: '' });
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

        {/* 샘플 애니메이션 관리 섹션 */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">✨ 샘플 애니메이션 관리</h2>
            <button
              onClick={() => {
                setShowSampleForm(!showSampleForm);
                if (showSampleForm) {
                  cancelForm();
                }
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
            >
              {showSampleForm ? '취소' : '+ 새 샘플 추가'}
            </button>
          </div>

          {/* 샘플 추가/수정 폼 */}
          {showSampleForm && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-4">
                {editingSample ? '샘플 수정' : '샘플 추가'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={sampleForm.title}
                    onChange={(e) => setSampleForm({ ...sampleForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="예: 강아지 뛰는 모습"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비디오 URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={sampleForm.videoUrl}
                    onChange={(e) => setSampleForm({ ...sampleForm, videoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    썸네일 URL (선택)
                  </label>
                  <input
                    type="url"
                    value={sampleForm.thumbnailUrl}
                    onChange={(e) => setSampleForm({ ...sampleForm, thumbnailUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명 (선택)
                  </label>
                  <textarea
                    value={sampleForm.description}
                    onChange={(e) => setSampleForm({ ...sampleForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="샘플에 대한 설명을 입력하세요"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={editingSample ? handleEditSample : handleAddSample}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                  >
                    {editingSample ? '수정하기' : '추가하기'}
                  </button>
                  <button
                    onClick={cancelForm}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 샘플 목록 */}
          {loadingSamples ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : sampleAnimations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 샘플이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <h3 className="font-semibold text-gray-800 mb-1">{sample.title}</h3>
                    {sample.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{sample.description}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(sample)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteSample(sample.id)}
                        className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                                updateRequestStatus(request.userId, request.id, 'failed', undefined, message || undefined);
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
                                updateRequestStatus(request.userId, request.id, 'completed', animationUrl, message || undefined);
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
                                updateRequestStatus(request.userId, request.id, 'failed', undefined, message || undefined);
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

