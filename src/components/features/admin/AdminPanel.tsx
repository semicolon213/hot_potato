import React, { useState } from 'react';
import { useAdminPanel } from '../../../hooks/features/admin/useAdminPanel';
import AdminKeySection from './AdminKeySection';
import UserList from './UserList';
import PinnedAnnouncementList from './PinnedAnnouncementList';
import AddUsersModal from './AddUsersModal';
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
  const {
    users,
    pendingUsers,
    approvedUsers,
    unusedUsers,
    pinnedAnnouncementRequests,
    emailToSend,
    setEmailToSend,
    isLoading,
    message,
    emailStatus,
    debugInfo,
    handleApproveUser,
    handleRejectUser,
    handleSendAdminKey,
    handleApprovePinnedAnnouncement,
    handleRejectPinnedAnnouncement,
    handleAddUsers
  } = useAdminPanel();
  
  const [isAddUsersModalOpen, setIsAddUsersModalOpen] = useState(false);

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

      <div className="users-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>사용자 관리</h3>
        <button
          onClick={() => setIsAddUsersModalOpen(true)}
          className="add-users-btn"
          disabled={isLoading}
          style={{
            background: 'var(--sidebar-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--sidebar-radius-sm)',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          사용자 일괄 추가
        </button>
      </div>

      <UserList
        users={users}
        pendingUsers={pendingUsers}
        approvedUsers={approvedUsers}
        unusedUsers={unusedUsers}
        isLoading={isLoading}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
      />

      <PinnedAnnouncementList
        requests={pinnedAnnouncementRequests}
        isLoading={isLoading}
        onApprove={handleApprovePinnedAnnouncement}
        onReject={handleRejectPinnedAnnouncement}
      />

      <AddUsersModal
        isOpen={isAddUsersModalOpen}
        onClose={() => setIsAddUsersModalOpen(false)}
        onSuccess={async () => {
          setIsAddUsersModalOpen(false);
          // 사용자 목록 새로고침은 useAdminPanel에서 처리
        }}
        onAddUsers={handleAddUsers}
        isLoading={isLoading}
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
