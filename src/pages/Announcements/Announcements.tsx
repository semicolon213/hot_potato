import React, { useState } from 'react';
import '../../styles/pages/Announcements.css';
import type { Post } from '../../types/app';
import { deleteSheetRow } from '../../utils/google/googleSheetUtils';
import { ENV_CONFIG } from '@/config/environment';

interface AnnouncementsProps {
  onPageChange: (pageName: string) => void;
  posts: Post[];
  isAuthenticated: boolean;
  announcementSpreadsheetId: string | null;
  isLoading: boolean;
  "data-oid": string;
}

const AnnouncementsPage: React.FC<AnnouncementsProps> = ({ onPageChange, posts, isAuthenticated, announcementSpreadsheetId, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePost = async (id: string) => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      if (!announcementSpreadsheetId) {
        alert('오류: 스프레드시트 ID를 찾을 수 없습니다.');
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

        await deleteSheetRow(announcementSpreadsheetId, ENV_CONFIG.ANNOUNCEMENT_SHEET_NAME, rowIndexToDelete);
        alert('공지사항이 삭제되었습니다.');
        window.location.reload();
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('공지사항 삭제 중 오류가 발생했습니다.');
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
    <div className="announcements-container">
      <div className="announcements-header">
        <h1 className="announcements-title">공지사항</h1>
        <div className="header-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="공지사항 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          {isAuthenticated && (
            <button 
              className="new-post-button" 
              onClick={() => onPageChange('new-announcement-post')}
              disabled={!announcementSpreadsheetId}
            >
              {announcementSpreadsheetId ? '새 공지 작성' : '불러오는 중...'}
            </button>
          )}
        </div>
      </div>
      <div className="post-list">
        {isLoading ? (
          <p className="loading-message">데이터를 불러오는 중입니다. 잠시만 기다려주세요...</p>
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
          <p className="no-results">{isAuthenticated ? '공지사항이 없습니다.' : '데이터를 불러오는 중입니다. 잠시만 기다려주세요...'}</p>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;