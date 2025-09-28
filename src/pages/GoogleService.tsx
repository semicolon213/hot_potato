import React, { useMemo, useRef, useEffect } from "react";
import "../styles/pages/GoogleService.css";

interface GoogleServiceProps {
  service: "appscript" | "sheets" | "docs" | "gemini" | "groups" | "calendar" | "chats";
} 

const SERVICE_URLS: Record<GoogleServiceProps["service"], string> = {
  appscript: "https://script.google.com/home/?hl=ko",
  sheets: "https://docs.google.com/spreadsheets/u/0/",
  docs: "https://docs.google.com/document/u/0/",
  gemini: "https://gemini.google.com/app?is_sa=1&android-min-version=301356232&ios-min-version=322.0",
  groups: "https://groups.google.com",
  calendar: "https://calendar.google.com/calendar/u/0/",
  chats: "https://mail.google.com/chat/u/0/#chat/home"
};

const GoogleServicePage: React.FC<GoogleServiceProps> = ({ service }) => {
  const url = useMemo(() => SERVICE_URLS[service], [service]);
  const webviewRef = useRef<HTMLWebViewElement>(null);

  useEffect(() => {
    if (webviewRef.current) {
      try {
        webviewRef.current.setAttribute("src", url);
      } catch (e) {
        console.error(e);
      }
    }
  }, [url]);

  return (
    <div className="google-service-container">
      {/* Electron 환경에서 webviewTag 활성 필요 */}
      <webview
        ref={webviewRef}
        src={url}
        className="google-service-webview"
        allowpopups={true}
      />
    </div>
  );
};

export default GoogleServicePage;


