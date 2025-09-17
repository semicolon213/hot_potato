import React from "react";
import "./Preferences.css";

interface PreferencesProps {
  onPageChange: (pageName: string) => void;
}

const Preferences: React.FC<PreferencesProps> = ({ onPageChange }) => {
  return (
    <div className="content">
      <div className="settings-container">
        <div className="settings-header">
          <h1>환경설정</h1>
          <p>현재 제공되는 설정 항목이 없습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
