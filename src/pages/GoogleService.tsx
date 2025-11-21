import React, { useMemo, useEffect, useRef, useState } from "react";
import "../styles/pages/GoogleService.css";

interface GoogleServiceProps {
  service: "appscript" | "sheets" | "docs" | "gemini" | "groups";
}

const SERVICE_URLS: Record<GoogleServiceProps["service"], string> = {
  appscript: "https://script.google.com/home/?hl=ko",
  sheets: "https://docs.google.com/spreadsheets/u/0/",
  docs: "https://docs.google.com/document/u/0/",
  gemini: "https://gemini.google.com/",
  groups: "https://groups.google.com/"
};

// Electron 환경 감지
const isElectron = () => {
  return typeof window !== 'undefined' && 
         (window.electronAPI !== undefined || 
          navigator.userAgent.toLowerCase().indexOf('electron') > -1);
};

const GoogleServicePage: React.FC<GoogleServiceProps> = ({ service }) => {
  const url = useMemo(() => SERVICE_URLS[service], [service]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webviewRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 컨테이너 크기 조정을 위한 리사이즈 이벤트 리스너
    const handleResize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        // 컨테이너가 화면에 보이는지 확인
        if (rect.width > 0 && rect.height > 0) {
          // iframe/webview 크기 강제 업데이트
          if (iframeRef.current) {
            iframeRef.current.style.width = `${rect.width}px`;
            iframeRef.current.style.height = `${rect.height}px`;
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 실행

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Electron 환경에서 webview 로드 이벤트 처리
  useEffect(() => {
    if (isElectron() && webviewRef.current) {
      const webview = webviewRef.current;
      
      const handleLoad = () => {
        setIsLoading(false);
        setError(null);
      };

      const handleError = (event: any) => {
        console.error('Webview load error:', event);
        setError('페이지를 로드할 수 없습니다.');
        setIsLoading(false);
      };

      // webview 이벤트 리스너 (Electron 전용)
      if (webview.addEventListener) {
        webview.addEventListener('did-finish-load', handleLoad);
        webview.addEventListener('did-fail-load', handleError);
      }

      return () => {
        if (webview.removeEventListener) {
          webview.removeEventListener('did-finish-load', handleLoad);
          webview.removeEventListener('did-fail-load', handleError);
        }
      };
    }
  }, [url]);

  // iframe 로드 이벤트 처리 (웹 브라우저)
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setError('페이지를 로드할 수 없습니다.');
    setIsLoading(false);
  };

  return (
    <div 
      ref={containerRef}
      className="google-service-container"
    >
      {isElectron() ? (
        // Electron 환경: webview 사용
        <webview
          ref={webviewRef}
          src={url}
          className="google-service-webview"
          allowpopups={true}
          webpreferences="allowRunningInsecureContent=true,webSecurity=false"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            display: 'block'
          }}
        />
      ) : (
        // 웹 브라우저 환경: iframe 사용
        <iframe
          ref={iframeRef}
          src={url}
          className="google-service-iframe"
          title={`Google ${service}`}
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            display: 'block'
          }}
        />
      )}

      {isLoading && (
        <div className="google-service-loading">
          <div className="loading-spinner"></div>
          <p>페이지를 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="google-service-error">
          <div className="error-message">
            <h3>오류 발생</h3>
            <p>{error}</p>
            <button 
              className="open-browser-btn"
              onClick={() => window.open(url, '_blank')}
            >
              브라우저에서 열기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleServicePage;
