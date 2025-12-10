// 오프라인 지원 유틸리티

export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

export const setupOfflineListener = (
  onOnline: () => void,
  onOffline: () => void
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

// 오프라인 큐에 메시지 저장
export const saveToOfflineQueue = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  
  try {
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    queue.push({ key, data, timestamp: Date.now() });
    localStorage.setItem('offlineQueue', JSON.stringify(queue));
  } catch (error) {
    console.error('오프라인 큐 저장 오류:', error);
  }
};

// 오프라인 큐에서 메시지 가져오기
export const getOfflineQueue = (): Array<{ key: string; data: any; timestamp: number }> => {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('offlineQueue') || '[]');
  } catch (error) {
    console.error('오프라인 큐 불러오기 오류:', error);
    return [];
  }
};

// 오프라인 큐 비우기
export const clearOfflineQueue = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('offlineQueue');
};

// 오프라인 큐에서 특정 항목 제거
export const removeFromOfflineQueue = (index: number) => {
  if (typeof window === 'undefined') return;
  
  try {
    const queue = getOfflineQueue();
    queue.splice(index, 1);
    localStorage.setItem('offlineQueue', JSON.stringify(queue));
  } catch (error) {
    console.error('오프라인 큐 항목 제거 오류:', error);
  }
};

