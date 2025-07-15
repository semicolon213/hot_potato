import React from "react";
import "./Mypage.css";

interface MypageProps {
  onPageChange: (pageName: string) => void;
}

const Mypage: React.FC<MypageProps> = ({ onPageChange }) => {
  return (
    <div className="mypage-container">
      <button onClick={() => onPageChange('ddd')}>Go to Dashboard</button>
    </div>
  );
};

export default Mypage;
