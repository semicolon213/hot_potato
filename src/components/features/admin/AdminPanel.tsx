import React from 'react';
import { useAdminPanel } from '../../../hooks/features/admin/useAdminPanel';
import AdminHeader from './AdminHeader';
import AdminKeySection from './AdminKeySection';
import UserList from './UserList';
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
  const {
    users,
    emailToSend,
    setEmailToSend,
    isLoading,
    message,
    emailStatus,
    handleApproveUser,
    handleRejectUser,
    handleSendAdminKey
  } = useAdminPanel();

  return (
    <div className="admin-panel">
      <AdminHeader />
      
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
        isLoading={isLoading}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
      />
    </div>
  );
};

export default AdminPanel;
