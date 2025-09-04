import React, { useState } from 'react';
import './Board.css';
import type { Post } from '../../App'; // Import Post interface from App.tsx

interface BoardProps {
  onPageChange: (pageName: string) => void;
  posts: Post[];
  onAuth: () => void;
  isAuthenticated: boolean;
  boardSpreadsheetId: string | null;
  "data-oid": string;
}

const Board: React.FC<BoardProps> = ({ onPageChange, posts, onAuth, isAuthenticated, boardSpreadsheetId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleDeletePost = (id: string) => {
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까? (기능 구현 필요)')) {
      console.log(`Deleting post ${id}`);
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
        <h1 className="board-title">자유게시판</h1>
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
          {!isAuthenticated ? (
            <button className="auth-button" onClick={onAuth}>Google 인증</button>
          ) : (
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
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <div key={post.id} className="post-card">
              <div className="card-header">
                <h3>{post.title}</h3>
                <button className="delete-button" onClick={() => handleDeletePost(post.id)}>x</button>
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
          <p className="no-results">{isAuthenticated ? '게시글이 없습니다.' : 'Google 인증 후 게시글을 볼 수 있습니다.'}</p>
        )}
      </div>
    </div>
  );
};

export default Board;