import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import "./index.css";
import { validateEnvironmentVariables } from "./config/environment";

// 환경 변수 검증
console.log("🔍 환경 변수 검증 중...");
if (!validateEnvironmentVariables()) {
  console.warn("⚠️ 일부 환경 변수가 설정되지 않았습니다. 앱이 제한적으로 작동할 수 있습니다.");
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "651515712118-8293tiue05sgfau7ujig52m5m37cfjoo.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider 
      clientId={clientId}
    >
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
