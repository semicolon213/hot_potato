import React, { useState } from 'react';
import '../../styles/pages/Board.css';
import type { Post } from '../../types/app';
import { deleteSheetRow } from '../../utils/google/googleSheetUtils';
import { ENV_CONFIG } from '../../config/environment';
import { useNotification } from '../../hooks/ui/useNotification';
import { NotificationModal } from '../../components/ui/NotificationModal';

interface BoardProps {
  onPageChange: (pageName: string) => void;
  posts: Post[];
  isAuthenticated: boolean;
  boardSpreadsheetId: string | null;
  isLoading: boolean;
  "data-oid": string;
}

const Board: React.FC<BoardProps> = ({ onPageChange, posts, isAuthenticated, boardSpreadsheetId, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { notification, showNotification, hideNotification } = useNotification();

  const handleDeletePost = async (id: string) => {
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      if (!boardSpreadsheetId) {
        showNotification('오류: 스프레드시트 ID를 찾을 수 없습니다.', 'error');
        return;
      }
      if (isDeleting) return;

      setIsDeleting(true);
      try {
        const postIndex = posts.findIndex(p => p.id === id);
        if (postIndex === -1) {
          throw new Error('삭제할 게시물을 찾지 못했습니다.');
        }

        const rowIndexToDelete = (posts.length - 1) - postIndex + 1;

        await deleteSheetRow(boardSpreadsheetId, ENV_CONFIG.BOARD_SHEET_NAME, rowIndexToDelete);
        showNotification('게시글이 삭제되었습니다.', 'success');
        window.location.reload();
      } catch (error) {
        console.error('Error deleting post:', error);
        showNotification('게시글 삭제 중 오류가 발생했습니다.', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.contentPreview.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="board-container">
      <div className="board-header">
        <div className="header-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="게시글 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          {isAuthenticated && (
            <button 
              className="new-post-button" 
              onClick={() => onPageChange('new-board-post')}
              disabled={!boardSpreadsheetId}
            >
              {boardSpreadsheetId ? '새 글 작성' : '불러오는 중...'}
            </button>
          )}
        </div>
      </div>
      <div className="post-list">
        {isLoading ? (
          <p className="loading-message">게시글을 불러오는 중입니다...</p>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <div key={post.id} className="post-card">
              <div className="card-header">
                <h3>{post.title}</h3>
                <button className="delete-button" onClick={() => handleDeletePost(post.id)} disabled={isDeleting}>x</button>
              </div>
              <div className="post-meta">
                <span className="author">{post.author}</span>
                <span>{post.date}</span>
                <span className="stats">조회 {post.views} | 좋아요 {post.likes}</span>
              </div>
              <p className="post-preview">{post.contentPreview}</p>
            </div>
          ))
        ) : (
          <p className="no-results">{isAuthenticated ? '게시글이 없습니다.' : '데이터를 불러오는 중입니다. 잠시만 기다려주세요...'}</p>
        )}
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
        duration={notification.duration}
      />
    </div>
  );
};

export default Board;