'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function ErrorPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const title = searchParams.get('title') || '发生错误';
  const message = searchParams.get('message') || '系统遇到了一个错误，请稍后重试。';
  const showRetry = searchParams.get('showRetry') === 'true';

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleRetry = () => {
    router.push('/');
    window.location.reload();
  };

  return (
    <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg p-8 text-center">
        {/* 错误图标 */}
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-red-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* 错误标题 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h1>

        {/* 错误信息 */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3">
          {showRetry && (
            <button
              onClick={handleRetry}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              重试
            </button>
          )}
          
          <button
            onClick={handleGoHome}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            返回首页
          </button>

          <button
            onClick={handleGoBack}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            返回上页
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <ErrorPageContent />
    </Suspense>
  );
}
