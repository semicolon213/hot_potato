
import React from 'react';
import { useParams } from 'react-router-dom';
import '../../styles/pages/AnnouncementDetail.css';

const AnnouncementDetail = () => {
  const { id } = useParams();

  return (
    <div className="announcement-detail-container">
      <h1>공지사항 상세 정보</h1>
      <p>공지사항 ID: {id}</p>
    </div>
  );
};

export default AnnouncementDetail;
