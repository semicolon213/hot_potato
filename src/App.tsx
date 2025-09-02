import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

interface User {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  isApproved: boolean;
}

type PageType = 'dashboard' | 'admin' | 'board' | 'documents' | 'calendar' | 'users' | 'settings';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  // 로그인 상태 확인
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // 로그인 처리
  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('google_token');
    // Google 로그아웃
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  // 페이지 전환 처리
  const handlePageChange = (pageName: string) => {
    setCurrentPage(pageName as PageType);
  };

  // 현재 페이지에 따른 컴포넌트 렌더링
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'admin':
        return <AdminPanel />;
      case 'board':
        return <div>게시판 페이지 (구현 예정)</div>;
      case 'documents':
        return <div>문서 페이지 (구현 예정)</div>;
      case 'calendar':
        return <div>일정 페이지 (구현 예정)</div>;
      case 'users':
        return <div>사용자 관리 페이지 (구현 예정)</div>;
      case 'settings':
        return <div>설정 페이지 (구현 예정)</div>;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return <div className="loading">로딩 중...</div>;
  }

  // 임시 테스트: 항상 로그인 화면 표시
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // 승인되지 않은 사용자
  if (!user.isApproved) {
    return (
      <div className="pending-approval">
        <div className="pending-card">
          <h2>승인 대기 중</h2>
          <p>관리자 승인을 기다리고 있습니다.</p>
          <div className="user-info">
            <p><strong>이름:</strong> {user.name}</p>
            <p><strong>이메일:</strong> {user.email}</p>
            <p><strong>학번/교번:</strong> {user.studentId}</p>
            <p><strong>구분:</strong> {user.isAdmin ? '관리자 요청' : '일반 사용자'}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  // 승인된 사용자 (관리자 및 일반 사용자)
  return (
    <div className="app">
      <Header onPageChange={handlePageChange} userInfo={user} onLogout={handleLogout} />
      <div className="main-content">
        <Sidebar onPageChange={handlePageChange} user={user} currentPage={currentPage} />
        <div className="content-area">
          {renderCurrentPage()}
        </div>

      </div>
    </div>
  );
};

export default App;