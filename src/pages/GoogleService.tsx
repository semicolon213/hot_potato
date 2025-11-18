import React, { useMemo, useRef, useEffect, useState } from "react";
import "../styles/pages/GoogleService.css";

interface GoogleServiceProps {
  service: "appscript" | "sheets" | "docs" | "gemini" | "groups";
}

const SERVICE_URLS: Record<GoogleServiceProps["service"], string> = {
  appscript: "https://script.google.com/home/?hl=ko",
  sheets: "https://docs.google.com/spreadsheets/u/0/",
  docs: "https://docs.google.com/document/u/0/",
  gemini: "https://gemini.google.com/app?is_sa=1&android-min-version=301356232&ios-min-version=322.0",
  groups: "https://groups.google.com"
};

const GoogleServicePage: React.FC<GoogleServiceProps> = ({ service }) => {
  const url = useMemo(() => SERVICE_URLS[service], [service]);
  const webviewRef = useRef<HTMLWebViewElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    
    if (webviewRef.current) {
      try {
        const webview = webviewRef.current;
        
        // webview 이벤트 리스너 설정
        const handleDidFailLoad = (event: any) => {
          console.error('Webview 로드 실패:', event);
          if (event.errorCode !== -3) { // -3은 ERR_ABORTED (일부 경우 정상)
            setHasError(true);
            setIsLoading(false);
          }
        };

        const handleDidFinishLoad = () => {
          setIsLoading(false);
          setHasError(false);
        };

        const handleDidStartLoading = () => {
          setIsLoading(true);
          setHasError(false);
        };

        webview.addEventListener('did-fail-load', handleDidFailLoad);
        webview.addEventListener('did-finish-load', handleDidFinishLoad);
        webview.addEventListener('did-start-loading', handleDidStartLoading);

        // webview 속성 설정
        webview.setAttribute("src", url);
        webview.setAttribute("allowpopups", "true");
        webview.setAttribute("webpreferences", "allowRunningInsecureContent=true,webSecurity=false");
        
        // useragent 설정 (선택사항)
        if (webview.setUserAgent) {
          webview.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          );
        }

        return () => {
          webview.removeEventListener('did-fail-load', handleDidFailLoad);
          webview.removeEventListener('did-finish-load', handleDidFinishLoad);
          webview.removeEventListener('did-start-loading', handleDidStartLoading);
        };
      } catch (e) {
        console.error('Webview 설정 오류:', e);
        setHasError(true);
        setIsLoading(false);
      }
    }
  }, [url]);

  const handleOpenInBrowser = () => {
    if (window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="google-service-container">
      {hasError && (
        <div className="google-service-error">
          <div className="error-message">
            <h3>페이지를 로드할 수 없습니다</h3>
            <p>Google 서비스가 webview에서 차단되었을 수 있습니다.</p>
            <button onClick={handleOpenInBrowser} className="open-browser-btn">
              브라우저에서 열기
            </button>
          </div>
        </div>
      )}
      
      {isLoading && !hasError && (
        <div className="google-service-loading">
          <div className="loading-spinner"></div>
          <p>로딩 중...</p>
        </div>
      )}

      {/* Electron 환경에서 webviewTag 활성 필요 */}
      <webview
        ref={webviewRef}
        src={url}
        className="google-service-webview"
        allowpopups="true"
        webpreferences="allowRunningInsecureContent=true,webSecurity=false"
        style={{ display: hasError ? 'none' : 'block' }}
      />
    </div>
  );
};

export default GoogleServicePage;


