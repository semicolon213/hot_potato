import React from "react";
import "../styles/pages/Mypage.css";

const Mypage: React.FC = () => {
  return (
    <div className="mypage-container">
      <section className="mypage-header" aria-hidden>
        <h1>마이페이지</h1>
      </section>

      <section className="profile-section">
        <div className="avatar-card">
          <div className="avatar" aria-hidden></div>
          <button className="btn btn-primary upload-btn" type="button">프로필 이미지 변경</button>
        </div>
        <div className="profile-info-card">
          <div className="info-row">
            <label>이름</label>
            <input className="form-input" type="text" placeholder="이름" />
          </div>
          <div className="info-row">
            <label>이메일</label>
            <input className="form-input" type="email" placeholder="이메일" disabled />
          </div>
          <div className="info-row">
            <label>전화번호</label>
            <input className="form-input" type="tel" placeholder="전화번호" />
          </div>
        </div>
      </section>

      {/* 계정 보안(비밀번호 변경) 섹션 제거 */}

      {/* 알림 등 환경 설정 섹션 제거 */}
    </div>
  );
};

export default Mypage;
