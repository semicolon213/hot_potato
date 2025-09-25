import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import "./index.css";

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
