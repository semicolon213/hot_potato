import React from 'react';
// 타입 정의
interface AdminUser {
  id: string;
  email: string;
  studentId: string;
  name: string;
  isAdmin: boolean;
  isApproved: boolean;
  requestDate: string;
  approvalDate?: string | null;
}

interface UserListProps {
  users: AdminUser[];
  isLoading: boolean;
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  isLoading,
  onApproveUser,
  onRejectUser
}) => {
  console.log('=== UserList 렌더링 ===');
  console.log('받은 users 배열:', users);
  console.log('users 배열 길이:', users?.length || 0);
  
  const pendingUsers = users?.filter(user => !user.isApproved) || [];
  const approvedUsers = users?.filter(user => user.isApproved) || [];
  
  console.log('승인 대기 사용자 수:', pendingUsers.length);
  console.log('승인 대기 사용자 목록:', pendingUsers.map(u => ({ id: u.id, name: u.name, isApproved: u.isApproved })));
  
  console.log('승인된 사용자 수:', approvedUsers.length);
  console.log('승인된 사용자 목록:', approvedUsers.map(u => ({ id: u.id, name: u.name, isApproved: u.isApproved })));

  return (
    <>
      {/* 승인 대기 사용자 */}
      <div className="users-section">
        <h3>승인 대기 사용자 ({pendingUsers.length}명)</h3>
        {pendingUsers.length === 0 ? (
          <p className="no-users">승인 대기 중인 사용자가 없습니다.</p>
        ) : (
          <div className="users-list">
            {pendingUsers.map(user => (
              <div key={user.id} className="user-card pending">
                <div className="user-info">
                  <div className="user-details">
                    <div className="user-name">{user.name || '이름 없음'}</div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-id">ID: {user.studentId}</div>
                    <div className="request-date">
                      요청일: {user.requestDate}
                    </div>
                  </div>
                  <div className="user-badge">
                    <div className={`user-type ${user.isAdmin ? 'admin' : 'user'}`}>
                      {user.isAdmin ? '관리자 요청' : '일반 사용자'}
                    </div>
                  </div>
                </div>
                <div className="user-actions">
                  <button 
                    onClick={() => onApproveUser(user.id)}
                    disabled={isLoading}
                    className="approve-btn"
                  >
                    ✅ 승인
                  </button>
                  <button 
                    onClick={() => onRejectUser(user.id)}
                    disabled={isLoading}
                    className="reject-btn"
                  >
                    ❌ 거부
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 승인된 사용자 */}
      <div className="users-section">
        <h3>승인된 사용자 ({approvedUsers.length}명)</h3>
        {approvedUsers.length === 0 ? (
          <p className="no-users">승인된 사용자가 없습니다.</p>
        ) : (
          <div className="users-list">
            {approvedUsers.map(user => (
              <div key={user.id} className="user-card approved">
                <div className="user-info">
                  <div className="user-details">
                    <div className="user-name">{user.name || '이름 없음'}</div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-id">ID: {user.studentId}</div>
                    <div className="request-date">
                      승인일: {user.approvalDate || user.requestDate}
                    </div>
                  </div>
                  <div className="user-badge">
                    <div className={`user-type ${user.isAdmin ? 'admin' : 'user'}`}>
                      {user.isAdmin ? '관리자' : '일반 사용자'}
                    </div>
                  </div>
                </div>
                <div className="user-status">
                  <span className="status-approved">✅ 승인됨</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UserList;
