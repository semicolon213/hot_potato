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
          <div className="user-list-container">
            <div className="user-list-header">
              <div className="user-list-cell">이름</div>
              <div className="user-list-cell">이메일</div>
              <div className="user-list-cell">학번</div>
              <div className="user-list-cell">유형</div>
              <div className="user-list-cell">요청일</div>
              <div className="user-list-cell">작업</div>
            </div>
            <div className="user-list-body">
              {pendingUsers.map(user => (
                <div key={user.id} className="user-list-row">
                  <div className="user-list-cell">{user.name || '이름 없음'}</div>
                  <div className="user-list-cell">{user.email}</div>
                  <div className="user-list-cell">{user.studentId}</div>
                  <div className="user-list-cell">
                    <span className={`user-type ${user.isAdmin ? 'admin' : 'user'}`}>
                      {user.isAdmin ? '관리자 요청' : '일반 사용자'}
                    </span>
                  </div>
                  <div className="user-list-cell">{user.requestDate}</div>
                  <div className="user-list-cell">
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 승인된 사용자 */}
      <div className="users-section">
        <h3>승인된 사용자 ({approvedUsers.length}명)</h3>
        {approvedUsers.length === 0 ? (
          <p className="no-users">승인된 사용자가 없습니다.</p>
        ) : (
          <div className="user-list-container">
            <div className="user-list-header">
              <div className="user-list-cell">이름</div>
              <div className="user-list-cell">이메일</div>
              <div className="user-list-cell">학번</div>
              <div className="user-list-cell">유형</div>
              <div className="user-list-cell">승인일</div>
              <div className="user-list-cell"></div>
            </div>
            <div className="user-list-body">
              {approvedUsers.map(user => (
                <div key={user.id} className="user-list-row">
                  <div className="user-list-cell">{user.name || '이름 없음'}</div>
                  <div className="user-list-cell">{user.email}</div>
                  <div className="user-list-cell">{user.studentId}</div>
                  <div className="user-list-cell">
                    <span className={`user-type ${user.isAdmin ? 'admin' : 'user'}`}>
                      {user.isAdmin ? '관리자' : '일반 사용자'}
                    </span>
                  </div>
                  <div className="user-list-cell">
                    {user.approvalDate || user.requestDate}
                  </div>
                  <div className="user-list-cell"></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserList;
