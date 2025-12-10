'use client';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ message = '로딩 중...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="min-h-screen flex items-center justify-center sky-background relative overflow-hidden">
      {/* 무지개 아치 */}
      <div className="rainbow-arc"></div>
      
      {/* 구름 */}
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      <div className="cloud cloud3"></div>
      
      {/* 천국 빛 */}
      <div className="heaven-light"></div>
      
      <div className="text-center relative z-10">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-purple-500 mx-auto`}></div>
        <p className="mt-4 text-white font-medium drop-shadow-lg">{message}</p>
      </div>
    </div>
  );
}

