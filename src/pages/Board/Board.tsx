import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw5Rzoc4jNPb4s5AR_3plso5sIe8lPLlroUVVva_H-XIG3WUY_P1OxPz3MZcUW3NfQ/exec";

const Board: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(SCRIPT_URL);
      const data = response.data;
      // The first row is headers, so slice(1)
      const formattedPosts: Post[] = data.slice(1).map((row: any, index: number) => ({
        id: row[0] || index + 1, // Assuming ID is in the first column
        title: row[1],
        author: row[2],
        date: new Date(row[3]).toISOString().slice(0, 10),
        views: row[4] || 0,
        likes: row[5] || 0,
        contentPreview: row[6] || '',
      }));
      setPosts(formattedPosts.reverse()); // Show latest posts first
      setError(null);
    } catch (err) {
      setError("데이터를 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleAddPost = async () => {
    if (newTitle.trim() === '' || newContent.trim() === '' || newAuthor.trim() === '') {
      alert('제목, 작성자, 내용을 모두 입력해주세요.');
      return;
    }

    const newPostData = {
      title: newTitle,
      author: newAuthor,
      content: newContent,
    };

    try {
      await axios.post(SCRIPT_URL, newPostData);
      // Refetch posts to show the new post
      fetchPosts();
      setNewTitle('');
      setNewContent('');
      setNewAuthor('');
      setShowModal(false);
    } catch (err) {
      alert("게시글을 추가하는데 실패했습니다.");
      console.error(err);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      try {
        await axios.post(SCRIPT_URL, { delete: id });
        fetchPosts(); // Refetch posts to reflect deletion
      } catch (err) {
        alert("게시글을 삭제하는데 실패했습니다.");
        console.error(err);
      }
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.contentPreview && post.contentPreview.toLowerCase().includes(searchTerm.toLowerCase())) ||
    post.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="board-container"><p>로딩 중...</p></div>;
  }

  if (error) {
    return <div className="board-container"><p>{error}</p></div>;
  }

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
