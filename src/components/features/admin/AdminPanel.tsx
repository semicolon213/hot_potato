import React from 'react';
import { useAdminPanel } from '../../../hooks/features/admin/useAdminPanel';
import AdminKeySection from './AdminKeySection';
import UserList from './UserList';
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
  const {
    users,
    pendingUsers,
    approvedUsers,
    emailToSend,
    setEmailToSend,
    isLoading,
    message,
    emailStatus,
    debugInfo,
    handleApproveUser,
    handleRejectUser,
    handleSendAdminKey
  } = useAdminPanel();

  return (
    <div className="admin-panel">
      <AdminKeySection
        emailToSend={emailToSend}
        setEmailToSend={setEmailToSend}
        isLoading={isLoading}
        emailStatus={emailStatus}
        message={message}
        onSendAdminKey={handleSendAdminKey}
      />

      <UserList
        users={users}
        pendingUsers={pendingUsers}
        approvedUsers={approvedUsers}
        isLoading={isLoading}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
      />

      {/* 디버깅 정보 (개발용) */}
      {/* <div style={{margin: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', fontSize: '12px'}}>
        <h4>🔍 디버깅 정보 (개발용)</h4>
        <pre style={{whiteSpace: 'pre-wrap', margin: 0}}>{debugInfo}</pre>
      </div> */}
    </div>
  );
};

export default AdminPanel;
