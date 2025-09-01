import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

interface User {
  email: string;
  studentId: string;
  isAdmin: boolean;
  isApproved: boolean;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    // Google 로그아웃
    if (window.gapi && window.gapi.auth2) {
      const auth2 = window.gapi.auth2.getAuthInstance();
      auth2.signOut();
    }
  };

  if (isLoading) {
    return <div className="loading">로딩 중...</div>;
  }

  // 로그인되지 않은 경우
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

  // 관리자인 경우 관리자 패널 표시
  if (user.isAdmin) {
    return (
      <div className="app">
        <Header user={user} onLogout={handleLogout} />
        <div className="main-content">
          <Sidebar onPageChange={() => {}} user={user} />
          <AdminPanel />
        </div>
      </div>
    );
  }

  // 일반 사용자인 경우 대시보드 표시
  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />
      <div className="main-content">
        <Sidebar onPageChange={() => {}} user={user} />
        <Dashboard />
      </div>
    </div>
  );
};

export default App;