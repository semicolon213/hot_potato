import React, { useState } from 'react';
import { FaCheck, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import GroupRoleModal from './GroupRoleModal';
import './UserList.css';
import { formatDateToYYYYMMDD } from '../../../utils/helpers/timeUtils';
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
  userType?: string;
  user_type?: string; // Apps Script 원본 필드
}

interface UserListProps {
  users: AdminUser[];
  pendingUsers: AdminUser[];
  approvedUsers: AdminUser[];
  unusedUsers: AdminUser[];
  isLoading: boolean;
  onApproveUser: (studentId: string, groupRole: string) => void;
  onRejectUser: (userId: string) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  pendingUsers,
  approvedUsers,
  unusedUsers,
  isLoading,
  onApproveUser,
  onRejectUser
}) => {
  const [modalUser, setModalUser] = useState<AdminUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [unusedPage, setUnusedPage] = useState(1);
  
  const ITEMS_PER_PAGE = 10;
  
  // 승인 대기 사용자 페이지네이션
  const pendingStartIndex = (pendingPage - 1) * ITEMS_PER_PAGE;
  const pendingEndIndex = pendingStartIndex + ITEMS_PER_PAGE;
  const displayedPendingUsers = pendingUsers.slice(pendingStartIndex, pendingEndIndex);
  const pendingTotalPages = Math.ceil(pendingUsers.length / ITEMS_PER_PAGE);
  
  // 승인된 사용자 페이지네이션
  const approvedStartIndex = (approvedPage - 1) * ITEMS_PER_PAGE;
  const approvedEndIndex = approvedStartIndex + ITEMS_PER_PAGE;
  const displayedApprovedUsers = approvedUsers.slice(approvedStartIndex, approvedEndIndex);
  const approvedTotalPages = Math.ceil(approvedUsers.length / ITEMS_PER_PAGE);
  
  // 미사용 사용자 페이지네이션
  const unusedStartIndex = (unusedPage - 1) * ITEMS_PER_PAGE;
  const unusedEndIndex = unusedStartIndex + ITEMS_PER_PAGE;
  const displayedUnusedUsers = unusedUsers.slice(unusedStartIndex, unusedEndIndex);
  const unusedTotalPages = Math.ceil(unusedUsers.length / ITEMS_PER_PAGE);

  const handleApproveClick = (user: AdminUser) => {
    console.log('UserList - 승인 클릭한 사용자:', user);
    console.log('UserList - user.userType:', user.userType);
    
    // userType을 명시적으로 포함한 객체 생성 (기본값 설정하지 않음)
    const modalUserData = {
      ...user,
      userType: user.userType
    };
    
    console.log('UserList - 모달로 전달할 데이터:', modalUserData);
    setModalUser(modalUserData);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalUser(null);
  };

  const handleApproveWithGroup = (studentId: string, groupRole: string) => {
    onApproveUser(studentId, groupRole);
    
    // 클립보드에 이메일 복사
    if (modalUser?.email) {
      navigator.clipboard.writeText(modalUser.email).then(() => {
        console.log('이메일이 클립보드에 복사되었습니다:', modalUser.email);
      }).catch((error) => {
        console.error('클립보드 복사 실패:', error);
      });
    }
    
    handleModalClose();
  };
  console.log('=== UserList 렌더링 ===');
  console.log('받은 users 배열:', users);
  console.log('users 배열 길이:', users?.length || 0);
  console.log('승인 대기 사용자 수:', pendingUsers?.length || 0);
  console.log('승인 대기 사용자 목록:', pendingUsers);
  console.log('승인된 사용자 수:', approvedUsers?.length || 0);
  console.log('승인된 사용자 목록:', approvedUsers);
  
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
              <div className="user-list-cell">요청 권한</div>
              <div className="user-list-cell">작업</div>
            </div>
            <div className="user-list-body">
              {displayedPendingUsers.map(user => (
                <div key={user.id} className="user-list-row">
                  <div className="user-list-cell">{user.name || '이름 없음'}</div>
                  <div className="user-list-cell">{user.email}</div>
                  <div className="user-list-cell">{user.studentId}</div>
                  <div className="user-list-cell">
                    <span className={`user-type ${user.isAdmin ? 'admin' : 'user'}`}>
                      {user.isAdmin ? '관리자 요청' : '일반 사용자'}
                    </span>
                  </div>
                  <div className="user-list-cell">
                    {(user.userType || user.user_type) === 'student' ? '학생' : 
                     (user.userType || user.user_type) === 'std_council' ? '집행부' : 
                     (user.userType || user.user_type) === 'supp' ? '조교' : 
                     (user.userType || user.user_type) === 'professor' ? '교수' : 
                     (user.userType || user.user_type) === 'ad_professor' ? '겸임교원' : 
                     user.userType || user.user_type || '-'}
                  </div>
                  <div className="user-list-cell">
                    <div className="user-actions">
                      <button
                        onClick={() => handleApproveClick(user)}
                        disabled={isLoading}
                        className="approve-btn"
                      >
                        <FaCheck className="btn-icon" />
                        <span>승인</span>
                      </button>
                      <button
                        onClick={() => onRejectUser(user.id)}
                        disabled={isLoading}
                        className="reject-btn"
                      >
                        <FaTimes className="btn-icon" />
                        <span>거부</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {pendingTotalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPendingPage(prev => Math.max(1, prev - 1))}
                  disabled={pendingPage === 1}
                  className="pagination-btn"
                >
                  <FaChevronLeft />
                </button>
                <span className="pagination-info">
                  {pendingPage} / {pendingTotalPages}
                </span>
                <button
                  onClick={() => setPendingPage(prev => Math.min(pendingTotalPages, prev + 1))}
                  disabled={pendingPage === pendingTotalPages}
                  className="pagination-btn"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
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
              {displayedApprovedUsers.map(user => (
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
                    {formatDateToYYYYMMDD(user.approvalDate || user.requestDate)}
                  </div>
                  <div className="user-list-cell"></div>
                </div>
              ))}
            </div>
            {approvedTotalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setApprovedPage(prev => Math.max(1, prev - 1))}
                  disabled={approvedPage === 1}
                  className="pagination-btn"
                >
                  <FaChevronLeft />
                </button>
                <span className="pagination-info">
                  {approvedPage} / {approvedTotalPages}
                </span>
                <button
                  onClick={() => setApprovedPage(prev => Math.min(approvedTotalPages, prev + 1))}
                  disabled={approvedPage === approvedTotalPages}
                  className="pagination-btn"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 미사용 사용자 */}
      <div className="users-section">
        <h3>미사용 사용자 ({unusedUsers.length}명)</h3>
        {unusedUsers.length === 0 ? (
          <p className="no-users">미사용 사용자가 없습니다.</p>
        ) : (
          <div className="user-list-container">
            <div className="user-list-header">
              <div className="user-list-cell">이름</div>
              <div className="user-list-cell">이메일</div>
              <div className="user-list-cell">학번</div>
              <div className="user-list-cell">유형</div>
              <div className="user-list-cell"></div>
              <div className="user-list-cell"></div>
            </div>
            <div className="user-list-body">
              {displayedUnusedUsers.map(user => (
                <div key={user.id} className="user-list-row">
                  <div className="user-list-cell">{user.name || '이름 없음'}</div>
                  <div className="user-list-cell">{user.email}</div>
                  <div className="user-list-cell">{user.studentId}</div>
                  <div className="user-list-cell">
                    <span className={`user-type ${user.isAdmin ? 'admin' : 'user'}`}>
                      {user.isAdmin ? '관리자' : '일반 사용자'}
                    </span>
                  </div>
                  <div className="user-list-cell"></div>
                  <div className="user-list-cell"></div>
                </div>
              ))}
            </div>
            {unusedTotalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setUnusedPage(prev => Math.max(1, prev - 1))}
                  disabled={unusedPage === 1}
                  className="pagination-btn"
                >
                  <FaChevronLeft />
                </button>
                <span className="pagination-info">
                  {unusedPage} / {unusedTotalPages}
                </span>
                <button
                  onClick={() => setUnusedPage(prev => Math.min(unusedTotalPages, prev + 1))}
                  disabled={unusedPage === unusedTotalPages}
                  className="pagination-btn"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 그룹스 권한 설정 모달 */}
      {modalUser && (
        <GroupRoleModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          user={modalUser}
          onApprove={handleApproveWithGroup}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default UserList;
