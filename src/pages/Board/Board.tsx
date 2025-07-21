import React, { useState } from 'react';
import './Board.css';

interface Post {
  id: number;
  title: string;
  author: string;
  date: string;
  views: number;
  likes: number;
  contentPreview: string;
}

const Board: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      title: "자유게시판 첫 글입니다!",
      author: "김철수",
      date: "2024-07-22",
      views: 120,
      likes: 15,
      contentPreview: "안녕하세요, 자유게시판에 처음으로 글을 남겨봅니다. 다들 잘 부탁드립니다!"
    },
    {
      id: 2,
      title: "오늘 점심 메뉴 추천 받아요",
      author: "이영희",
      date: "2024-07-21",
      views: 88,
      likes: 8,
      contentPreview: "점심시간이 다가오는데 뭘 먹어야 할지 고민이네요. 맛있는 메뉴 추천해주실 분?"
    },
    {
      id: 3,
      title: "주말에 가볼 만한 곳 추천해주세요",
      author: "박지성",
      date: "2024-07-20",
      views: 205,
      likes: 25,
      contentPreview: "이번 주말에 나들이 가려고 하는데, 괜찮은 장소 있으면 공유 부탁드립니다!"
    },
    {
      id: 4,
      title: "새로운 프로젝트 아이디어 공유",
      author: "최수정",
      date: "2024-07-19",
      views: 95,
      likes: 10,
      contentPreview: "최근에 생각한 프로젝트 아이디어가 있는데, 같이 이야기 나눠볼 분 계신가요?"
    },
    {
      id: 5,
      title: "개발 환경 설정 팁 공유합니다",
      author: "정우성",
      date: "2024-07-18",
      views: 300,
      likes: 40,
      contentPreview: "초보 개발자분들을 위한 개발 환경 설정 팁을 정리해봤습니다. 도움이 되셨으면 좋겠네요."
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState(''); // 작성자 추가

  const handleAddPost = () => {
    if (newTitle.trim() === '' || newContent.trim() === '' || newAuthor.trim() === '') {
      alert('제목, 작성자, 내용을 모두 입력해주세요.');
      return;
    }

    const newPost: Post = {
      id: posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1,
      title: newTitle,
      author: newAuthor,
      date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD 형식
      views: 0,
      likes: 0,
      contentPreview: newContent,
    };

    setPosts([newPost, ...posts]); // 최신 글이 위로 오도록
    setNewTitle('');
    setNewContent('');
    setNewAuthor('');
    setShowModal(false);
  };

  const handleDeletePost = (id: number) => {
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      setPosts(posts.filter(post => post.id !== id));
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
          <button className="new-post-button" onClick={() => setShowModal(true)}>새 글 작성</button>
        </div>
      </div>
      <div className="post-list">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <div key={post.id} className="post-card">
              <div className="card-header">
                <h3>{post.title}</h3>
                <button className="delete-button" onClick={() => handleDeletePost(post.id)}>삭제</button>
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
          <p className="no-results">검색 결과가 없습니다.</p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>새 글 작성</h2>
            <input
              type="text"
              placeholder="제목"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="작성자"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
            />
            <textarea
              placeholder="내용"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            ></textarea>
            <div className="modal-actions">
              <button onClick={handleAddPost}>작성</button>
              <button onClick={() => setShowModal(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
