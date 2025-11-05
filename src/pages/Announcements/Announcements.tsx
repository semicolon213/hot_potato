import React, { useState } from 'react';
import { BiPencil } from "react-icons/bi";
import '../../styles/pages/Announcements.css';
import type { Post, User } from '../../types/app';
import RightArrowIcon from '../../assets/Icons/right_black.svg';

interface AnnouncementsProps {
  onPageChange: (pageName: string) => void;
  onSelectAnnouncement: (post: Post) => void;
  posts: Post[];
  isAuthenticated: boolean;
  announcementSpreadsheetId: string | null;
  isLoading: boolean;
  user: User | null;
  "data-oid": string;
}

// Helper function to generate pagination numbers
const getPaginationNumbers = (currentPage: number, totalPages: number) => {
  const pageNeighbours = 2; // How many pages to show on each side of the current page
  const totalNumbers = (pageNeighbours * 2) + 1; // Total page numbers to show
  const totalBlocks = totalNumbers + 2; // Total numbers + 2 for ellipses

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const startPage = Math.max(2, currentPage - pageNeighbours);
  const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
  let pages: (string | number)[] = Array.from({ length: (endPage - startPage) + 1 }, (_, i) => startPage + i);

  const hasLeftSpill = startPage > 2;
  const hasRightSpill = (totalPages - endPage) > 1;
  const spillOffset = totalNumbers - (pages.length + 1);

  switch (true) {
    // handle: (1) ... {5 6 7} ... (10)
    case (hasLeftSpill && !hasRightSpill):
      const extraPages = Array.from({ length: spillOffset }, (_, i) => startPage - 1 - i).reverse();
      pages = ['...', ...extraPages, ...pages];
      break;

    // handle: (1) {2 3 4} ... (10)
    case (!hasLeftSpill && hasRightSpill):
      const extraPages_ = Array.from({ length: spillOffset }, (_, i) => endPage + 1 + i);
      pages = [...pages, ...extraPages_, '...'];
      break;

    // handle: (1) ... {4 5 6} ... (10)
    case (hasLeftSpill && hasRightSpill):
    default:
      pages = ['...', ...pages, '...'];
      break;
  }

  return [1, ...pages, totalPages];
};


const AnnouncementsPage: React.FC<AnnouncementsProps> = ({ onPageChange, onSelectAnnouncement, posts, isAuthenticated, announcementSpreadsheetId, isLoading, user }) => {
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
    if (searchCriteria === 'content') {
      return post.content.toLowerCase().includes(term);
    }
    return false;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const paginationNumbers = totalPages > 1 ? getPaginationNumbers(currentPage, totalPages) : [];

  return (
    <div className="announcements-container">
      <div className="announcements-header">
        <h1 className="announcements-title">공지사항</h1>
      </div>
      <div className="actions-bar">
        <div className="total-posts">총 {filteredPosts.length}건</div>
        <div className="actions-right">
          <div className="search-box">
            <div className="select-wrapper">
              <select 
                value={searchCriteria} 
                onChange={(e) => setSearchCriteria(e.target.value)} 
                className="search-criteria-select"
              >
                <option value="title">제목</option>
                <option value="author">작성자</option>
                <option value="content">내용</option>
              </select>
            </div>
            <input
              type="text"
              placeholder={`${searchCriteria === 'title' ? '제목' : searchCriteria === 'author' ? '작성자' : '내용'}으로 검색...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on new search
              }}
            />
          </div>
          {isAuthenticated && user && user.isAdmin && (
            <button 
              className="new-post-button" 
              onClick={() => onPageChange('new-announcement-post')}
              disabled={!announcementSpreadsheetId}
            >
              {announcementSpreadsheetId ? <><BiPencil /> 새 공지</> : '불러오는 중...'}
            </button>
          )}
        </div>
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
                  <tr key={post.id} onClick={() => onSelectAnnouncement(post)}>
                    <td className="col-number">{filteredPosts.length - (indexOfFirstPost + index)}</td>
                    <td className="col-title">{post.title}</td>
                    <td className="col-author">{post.author}</td>
                    <td className="col-views">{post.views}</td>
                    <td className="col-date">{post.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="page-arrow-link">
                  <img src={RightArrowIcon} alt="Previous" className="arrow-icon arrow-left" />
                  <span>이전</span>
                </button>

                {paginationNumbers.map((page, index) => {
                  if (typeof page === 'string') {
                    return <span key={`ellipsis-${index}`} className="page-ellipsis">...</span>;
                  }
                  return (
                    <button 
                      key={page} 
                      onClick={() => paginate(page)} 
                      className={`page-link ${currentPage === page ? 'active' : ''}`}>
                      {page}
                    </button>
                  );
                })}

                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="page-arrow-link">
                  <span>다음</span>
                  <img src={RightArrowIcon} alt="Next" className="arrow-icon" />
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="no-results">{isAuthenticated ? '공지사항이 없습니다.' : '데이터를 불러오는 중입니다. 잠시만 기다려주세요...'}</p>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;