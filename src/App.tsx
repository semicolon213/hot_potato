import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./components/Login";
import "./index.css"; // Global styles and theme variables
import { GoogleOAuthProvider } from '@react-oauth/google'; // Import GoogleOAuthProvider
import { useAuthStore } from "./hooks/useAuthStore";

import Calendar from "./pages/Calendar";
import Dashboard from "./pages/Dashboard";
import Docbox from "./pages/Docbox";
import DocumentManagement from "./pages/DocumentManagement";
import EmptyDocument from "./pages/EmptyDocument";
import Mypage from "./pages/Mypage";
import NewDocument from "./pages/NewDocument";
import Preferences from "./pages/Preferences";
import Board from "./pages/Board/Board";
import Announcements from "./pages/Announcements/Announcements";
import Proceedings from "./pages/proceedings";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; // Access from .env

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>("dashboard"); // Default to dashboard
  const { user, isAuthenticated, isApproved } = useAuthStore();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get("page");
    if (page) {
      setCurrentPage(page);
    }

    // Apply saved theme on initial load
    const savedTheme = localStorage.getItem("selectedTheme") || "default";
    document.body.classList.add(`theme-${savedTheme}`);
  }, []);

  const handlePageChange = (pageName: string) => {
    setCurrentPage(pageName);
    history.pushState({ page: pageName }, pageName, `?page=${pageName}`);
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case "document_management":
        return (
          <DocumentManagement
            onPageChange={handlePageChange}
            data-oid="i8mtyop"
          />
        );

      case "docbox":
        return <Docbox data-oid="t94yibd" />;
      case "new_document":
        return (
          <NewDocument onPageChange={handlePageChange} data-oid="ou.h__l" />
        );

      case "calendar":
        return <Calendar data-oid="uz.ewbm" accessToken={user?.googleAccessToken} />; // Pass accessToken to Calendar
      case "preferences":
        return (
          <Preferences onPageChange={handlePageChange} data-oid="1db782u" />
        );

      case "mypage":
        return <Mypage data-oid="d01oi2r" />;
      case "board":
        return <Board data-oid="d01oi2r" />;
      case "announcements":
        return <Announcements data-oid="d01oi2r" />;
      case "empty_document":
        return <EmptyDocument data-oid="n.rsz_n" />;
      case "proceedings":
        return <Proceedings />;
      case "dashboard":
      default:
        return <Dashboard data-oid="4au2z.y" />;
    }
  };

  // 로그인하지 않았거나 승인되지 않은 경우 로그인 화면 표시
  if (!isAuthenticated || !user?.isApproved) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Login />
      </GoogleOAuthProvider>
    );
  }

  // 승인된 사용자는 메인 화면 표시
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="app-container" data-oid="g1w-gjq">
        <Sidebar onPageChange={handlePageChange} data-oid="7q1u3ax" />
        <div className="main-panel" data-oid="n9gxxwr">
          <Header onPageChange={handlePageChange} />
          <div className="content" id="dynamicContent" data-oid="nn2e18p">
            {renderPageContent()}
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;