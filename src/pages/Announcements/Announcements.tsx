import React, { useState } from 'react';
import './Announcements.css';

interface Announcement {
  id: number;
  title: string;
  date: string;
  content: string;
}

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: "시스템 점검 안내 (7/25 01:00 ~ 03:00)",
      date: "2024-07-22",
      content: "더 나은 서비스 제공을 위해 시스템 점검이 예정되어 있습니다. 서비스 이용에 참고 부탁드립니다."
    },
    {
      id: 2,
      title: "개인정보처리방침 개정 안내",
      date: "2024-07-15",
      content: "개인정보처리방침이 개정되어 안내드립니다. 자세한 내용은 공지사항을 확인해주세요."
    },
    {
      id: 3,
      title: "신규 기능 업데이트: 대시보드 위젯 추가",
      date: "2024-07-10",
      content: "대시보드에 새로운 위젯 추가 기능이 업데이트되었습니다. 다양한 정보를 한눈에 확인하세요."
    },
    {
      id: 4,
      title: "서비스 이용 약관 변경 안내",
      date: "2024-07-01",
      content: "서비스 이용 약관이 일부 변경되었습니다. 변경된 약관을 확인하시고 이용에 불편 없으시길 바랍니다."
    },
    {
      id: 5,
      title: "임시 공지: 긴급 서버 패치 완료",
      date: "2024-06-28",
      content: "긴급 서버 패치가 완료되어 모든 서비스가 정상화되었습니다. 이용에 불편을 드려 죄송합니다."
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleAddAnnouncement = () => {
    if (newTitle.trim() === '' || newContent.trim() === '') {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const newAnnouncement: Announcement = {
      id: announcements.length > 0 ? Math.max(...announcements.map(a => a.id)) + 1 : 1,
      title: newTitle,
      date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD 형식
      content: newContent,
    };

    setAnnouncements([newAnnouncement, ...announcements]); // 최신 공지가 위로 오도록
    setNewTitle('');
    setNewContent('');
    setShowModal(false);
  };

  const handleDeleteAnnouncement = (id: number) => {
    if (window.confirm('정말로 이 공지를 삭제하시겠습니까?')) {
      setAnnouncements(announcements.filter(announcement => announcement.id !== id));
    }
  };

  return (
    <div className="announcements-container">
      <div className="announcements-header">
        <h1 className="announcements-title">공지사항</h1>
        <button className="new-post-button" onClick={() => setShowModal(true)}>새 공지 작성</button>
      </div>
      <div className="announcements-grid">
        {announcements.map(announcement => (
          <div key={announcement.id} className="announcement-card">
            <h3>{announcement.title}</h3>
            <p className="announcement-meta">게시일: {announcement.date}</p>
            <p>{announcement.content}</p>
            <button className="delete-button" onClick={() => handleDeleteAnnouncement(announcement.id)}>x</button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>새 공지 작성</h2>
            <input
              type="text"
              placeholder="제목"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              placeholder="내용"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            ></textarea>
            <div className="modal-actions">
              <button onClick={handleAddAnnouncement}>작성</button>
              <button onClick={() => setShowModal(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
