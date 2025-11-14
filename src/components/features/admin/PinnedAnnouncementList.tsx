import React, { useState } from 'react';
import { FaCheck, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './UserList.css';
import { formatDateToYYYYMMDD } from '../../../utils/helpers/timeUtils';

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
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // 페이지네이션
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedRequests = requests.slice(startIndex, endIndex);
  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
  
  console.log('📌 PinnedAnnouncementList 렌더링:', { requestsCount: requests.length, requests });
  
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
            {displayedRequests.map(request => (
              <div key={request.id} className="user-list-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr' }}>
                <div className="user-list-cell">{request.title}</div>
                <div className="user-list-cell">
                  {request.writer}
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {request.writerEmail}
                  </div>
                </div>
                <div className="user-list-cell">{formatDateToYYYYMMDD(request.date)}</div>
                <div className="user-list-cell">
                  <div className="user-actions">
                    <button
                      onClick={() => onApprove(request.id)}
                      disabled={isLoading}
                      className="approve-btn"
                    >
                      <FaCheck className="btn-icon" />
                      <span>승인</span>
                    </button>
                    <button
                      onClick={() => onReject(request.id)}
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
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="pagination-btn"
              >
                <FaChevronLeft />
              </button>
              <span className="pagination-info">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="pagination-btn"
              >
                <FaChevronRight />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PinnedAnnouncementList;

