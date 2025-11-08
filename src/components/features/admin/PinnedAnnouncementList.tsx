import React from 'react';
import './UserList.css';

interface PinnedAnnouncementRequest {
  id: string;
  title: string;
  writer: string;
  writerEmail: string;
  writerId: string;
  date: string;
  status: 'pending';
}

interface PinnedAnnouncementListProps {
  requests: PinnedAnnouncementRequest[];
  isLoading: boolean;
  onApprove: (announcementId: string) => void;
  onReject: (announcementId: string) => void;
}

const PinnedAnnouncementList: React.FC<PinnedAnnouncementListProps> = ({
  requests,
  isLoading,
  onApprove,
  onReject
}) => {
  return (
    <div className="users-section">
      <h3>📌 고정 공지 승인 요청 ({requests.length}개)</h3>
      {requests.length === 0 ? (
        <p className="no-users">승인 대기 중인 고정 공지가 없습니다.</p>
      ) : (
        <div className="user-list-container">
          <div className="user-list-header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr' }}>
            <div className="user-list-cell">제목</div>
            <div className="user-list-cell">작성자</div>
            <div className="user-list-cell">작성일</div>
            <div className="user-list-cell">작업</div>
          </div>
          <div className="user-list-body">
            {requests.map(request => (
              <div key={request.id} className="user-list-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr' }}>
                <div className="user-list-cell">{request.title}</div>
                <div className="user-list-cell">
                  {request.writer}
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {request.writerEmail}
                  </div>
                </div>
                <div className="user-list-cell">{request.date}</div>
                <div className="user-list-cell">
                  <div className="user-actions">
                    <button
                      onClick={() => onApprove(request.id)}
                      disabled={isLoading}
                      className="approve-btn"
                    >
                      ✅ 승인
                    </button>
                    <button
                      onClick={() => onReject(request.id)}
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
  );
};

export default PinnedAnnouncementList;

