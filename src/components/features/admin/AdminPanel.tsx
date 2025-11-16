import React, { useState } from 'react';
import { useAdminPanel } from '../../../hooks/features/admin/useAdminPanel';
import AdminKeySection from './AdminKeySection';
import UserList from './UserList';
import PinnedAnnouncementList from './PinnedAnnouncementList';
import AddUsersModal from './AddUsersModal';
import StatCard from '../documents/StatCard';
import { FaUserClock, FaUserCheck, FaUserTimes, FaBullhorn } from 'react-icons/fa';
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
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'unused' | 'pinned'>('pending');

  const adminStatCards = [
    {
      count: pendingUsers.length,
      title: "승인 대기 사용자",
      backgroundColor: "#E3F2FD",
      textColor: "#000000",
      icon: FaUserClock,
      iconColor: "#1976D2",
      tab: 'pending' as const,
    },
    {
      count: approvedUsers.length,
      title: "승인된 사용자",
      backgroundColor: "#E8F5E9",
      textColor: "#000000",
      icon: FaUserCheck,
      iconColor: "#388E3C",
      tab: 'approved' as const,
    },
    {
      count: unusedUsers.length,
      title: "미사용 사용자",
      backgroundColor: "#FFF9C4",
      textColor: "#000000",
      icon: FaUserTimes,
      iconColor: "#F57C00",
      tab: 'unused' as const,
    },
    {
      count: pinnedAnnouncementRequests.length,
      title: "고정 공지 승인 요청",
      backgroundColor: "#FCE4EC",
      textColor: "#000000",
      icon: FaBullhorn,
      iconColor: "#C2185B",
      tab: 'pinned' as const,
    },
  ];

  return (
    <div className="admin-panel">
      {/* 관리자 통계 카드 */}
      <div className="admin-stats-container">
        {adminStatCards.map((stat, index) => (
          <StatCard
            key={index}
            count={stat.count}
            title={stat.title}
            backgroundColor={stat.backgroundColor}
            textColor={stat.textColor}
            icon={stat.icon}
            iconColor={stat.iconColor}
            onClick={() => setActiveTab(stat.tab)}
          />
        ))}
      </div>

      <AdminKeySection
        emailToSend={emailToSend}
        setEmailToSend={setEmailToSend}
        isLoading={isLoading}
        emailStatus={emailStatus}
        message={message}
        onSendAdminKey={handleSendAdminKey}
      />

      <div className="admin-content-container">
        <div className="admin-tabs-container">
          <div className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              승인 대기 사용자 ({pendingUsers.length})
            </button>
            <button
              className={`admin-tab ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              승인된 사용자 ({approvedUsers.length})
            </button>
            <button
              className={`admin-tab ${activeTab === 'unused' ? 'active' : ''}`}
              onClick={() => setActiveTab('unused')}
            >
              미사용 사용자 ({unusedUsers.length})
            </button>
            <button
              className={`admin-tab ${activeTab === 'pinned' ? 'active' : ''}`}
              onClick={() => setActiveTab('pinned')}
            >
              고정 공지 승인 요청 ({pinnedAnnouncementRequests.length})
            </button>
          </div>
          {activeTab !== 'pinned' && (
        <button
          onClick={() => setIsAddUsersModalOpen(true)}
          className="add-users-btn"
          disabled={isLoading}
        >
          사용자 일괄 추가
        </button>
          )}
      </div>

        <div className="admin-tab-content">
          {activeTab === 'pending' && (
      <UserList
        users={users}
        pendingUsers={pendingUsers}
              approvedUsers={[]}
              unusedUsers={[]}
              isLoading={isLoading}
              onApproveUser={handleApproveUser}
              onRejectUser={handleRejectUser}
              showOnlyPending={true}
            />
          )}
          {activeTab === 'approved' && (
            <UserList
              users={users}
              pendingUsers={[]}
        approvedUsers={approvedUsers}
              unusedUsers={[]}
              isLoading={isLoading}
              onApproveUser={handleApproveUser}
              onRejectUser={handleRejectUser}
              showOnlyApproved={true}
            />
          )}
          {activeTab === 'unused' && (
            <UserList
              users={users}
              pendingUsers={[]}
              approvedUsers={[]}
        unusedUsers={unusedUsers}
        isLoading={isLoading}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
              showOnlyUnused={true}
      />
          )}
          {activeTab === 'pinned' && (
      <PinnedAnnouncementList
        requests={pinnedAnnouncementRequests}
        isLoading={isLoading}
        onApprove={handleApprovePinnedAnnouncement}
        onReject={handleRejectPinnedAnnouncement}
      />
          )}
        </div>
      </div>

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
