import React, { useState } from 'react';
import '../../styles/pages/Announcements.css';
import type { Post } from '../../types/app';

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
  const [searchCriteria, setSearchCriteria] = useState('title'); // 'title' or 'author'
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const filteredPosts = posts.filter(post => {
    const term = searchTerm.toLowerCase();
    if (searchCriteria === 'title') {
      return post.title.toLowerCase().includes(term);
    }
    if (searchCriteria === 'author') {
      return post.author.toLowerCase().includes(term);
    }
    return false;
  });

  // Pagination logic
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="announcements-container">
      <div className="announcements-header">
        <h1 className="announcements-title">공지사항</h1>
      </div>
      <div className="actions-bar">
        <div className="search-box">
          <select 
            value={searchCriteria} 
            onChange={(e) => setSearchCriteria(e.target.value)} 
            className="search-criteria-select"
          >
            <option value="title">제목</option>
            <option value="author">작성자</option>
          </select>
          <input
            type="text"
            placeholder={`${searchCriteria === 'title' ? '제목' : '작성자'}으로 검색...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on new search
            }}
          />
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
      
      <div className="post-list">
        {isLoading ? (
          <p className="loading-message">데이터를 불러오는 중입니다. 잠시만 기다려주세요...</p>
        ) : filteredPosts.length > 0 ? (
          <>
            <table className="post-table">
              <thead>
                <tr>
                  <th className="col-number">번호</th>
                  <th className="col-title">제목</th>
                  <th className="col-author">작성자</th>
                  <th className="col-views">조회</th>
                  <th className="col-date">작성일자</th>
                </tr>
              </thead>
              <tbody>
                {currentPosts.map((post, index) => (
                  <tr key={post.id}>
                    <td className="col-number">{filteredPosts.length - (indexOfFirstPost + index)}</td>
                    <td className="col-title">{post.title}</td>
                    <td className="col-author">{post.author}</td>
                    <td className="col-views">{post.views}</td>
                    <td className="col-date">{post.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <span>전체 {filteredPosts.length}개 중 {currentPage} 페이지 / 총 {totalPages} 페이지</span>
              <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                이전
              </button>
              <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>
                다음
              </button>
            </div>
          </>
        ) : (
          <p className="no-results">{isAuthenticated ? '공지사항이 없습니다.' : '데이터를 불러오는 중입니다. 잠시만 기다려주세요...'}</p>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
