
import React from 'react';
import { useParams } from 'react-router-dom';
import '../../styles/pages/AnnouncementDetail.css';

const AnnouncementDetail = () => {
  const { id } = useParams();

  return (
    <div className="announcement-detail-container">
      <p>공지사항 ID: {id}</p>
    </div>
  );
};

export default AnnouncementDetail;
