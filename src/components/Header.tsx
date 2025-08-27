import React, { useState, useEffect } from "react";
import "./Header.css";
import {
  searchIcon,
  bellIcon,
  fileIcon,
  usersIcon,
  calendarIcon,
  messageIcon as chatIcon,
} from "../assets/Icons";
import { gapiInit } from 'papyrus-db';
import { tabs } from "./TemplateUI/CategoryTabs";
// Define the structure of the user profile object
interface UserProfile {
  name: string;
  picture: string;
  email: string;
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID; // .env에서 불러오기

async function handleGoogleAuth() {
  try {
    await gapiInit(clientId);
    // 인증 성공 후, 구글 시트/드라이브 API 사용 가능
    alert('구글 인증 성공!');
  } catch (e) {
    alert('구글 인증 실패: ' + (e as Error).message);

  }

}
interface HeaderProps {
  onPageChange: (pageName: string) => void;
  addTemplate: (newDocData: { title: string; description: string; tag: string; }) => void;
}

const Header: React.FC<HeaderProps> = ({ onPageChange, addTemplate }) => { // Destructure new prop
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isNotificationPanelOpen, setIsNotificationPanelPanelOpen] = useState(false);
  const [isChatOverlayOpen, setIsChatOverlayOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
      { content: string; time: string; type: "user" | "system" }[]
  >([
    {
      content: "안녕하세요! 무엇을 도와드릴까요?",
      time: "지금",
      type: "system",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // + 새 문서 모달 상태 추가 (3개 필드)
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocData, setNewDocData] = useState({
    title: "",
    description: "",
    tag: ""
  });

  // Check for logged-in user on component mount
  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userProfile");
    localStorage.removeItem("googleAccessToken"); // Clear Google access token
    setUserProfile(null);
  };


  const handleNotificationClick = () => {
    setIsNotificationPanelPanelOpen(!isNotificationPanelOpen);
  };

  const handleChatButtonClick = () => {
    setIsChatOverlayOpen(!isChatOverlayOpen);
  };

  const handleSendMessage = () => {
    if (chatInput.trim() === "") return;

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const timeString = `${hours}:${minutes}`;

    setChatMessages((prevMessages) => [
      ...prevMessages,
      { content: chatInput, time: timeString, type: "user" },
    ]);
    setChatInput("");

    setTimeout(() => {
      setChatMessages((prevMessages) => [
        ...prevMessages,
        {
          content: "메시지를 받았습니다. 조금만 기다려주세요.",
          time: timeString,
          type: "system",
        },
      ]);
    }, 1000);
  };

  // 새 문서 모달 제출 처리
  const handleNewDocSubmit = () => {
    if (!newDocData.title.trim() || !newDocData.description.trim() || !newDocData.tag.trim()) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    addTemplate(newDocData);

    // 모달 닫기 및 상태 초기화
    setShowNewDocModal(false);
    setNewDocData({
      title: "",
      description: "",
      tag: ""
    });
  };

  // 모달 취소 처리
  const handleNewDocCancel = () => {
    setShowNewDocModal(false);
    setNewDocData({
      title: "",
      description: "",
      tag: ""
    });
  };

  // 입력값 변경 처리
  const handleInputChange = (field: string, value: string) => {
    setNewDocData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
          isNotificationPanelOpen &&
          !(event.target as HTMLElement).closest(".bell-button") &&
          !(event.target as HTMLElement).closest(".notification-panel")
      ) {
        setIsNotificationPanelPanelOpen(false);
      }
    };

    // ESC 키로 모달 닫기
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showNewDocModal) {
        handleNewDocCancel();
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationPanelOpen, showNewDocModal]);

  return (
      <div className="header" data-oid="klo-qi-">
        <div
            className="new-doc-button"
            onClick={() => setShowNewDocModal(true)}
            data-oid="b._cfb5"
        >
          <div className="new-doc-button-text" data-oid="bm:nvgx">
            + 새 문서
          </div>
        </div>

        <div className="search-container" data-oid="ztfgwty">
          <img
              src={searchIcon}
              alt="Search Icon"
              className="icon"
              data-oid="i8vx3cc"
          />

          <input
              type="text"
              className="search-input"
              placeholder="문서 검색"
              data-oid="750ewi9"
          />
        </div>

        <div className="header-actions" data-oid="xq1uhkt">
          <div
              className="chat-button"
              onClick={handleChatButtonClick}
              data-oid=".jf5:th"
          >
            <img
                src={chatIcon}
                alt="Chat Icon"
                className="icon"
                data-oid="pco6m-n"
            />

            <div className="chat-notification-dot" data-oid="czkq0wr"></div>
          </div>

          <div
              className="bell-button"
              onClick={handleNotificationClick}
              data-oid="gglwxgo"
          >
            <img
                src={bellIcon}
                alt="Bell Icon"
                className="icon"
                data-oid="6hxi9s."
            />

            <div className="notification-dot" data-oid="99.ajod"></div>

            {isNotificationPanelOpen && (
                <div className="notification-panel" data-oid="uxrq5fu">
                  <div className="notification-header" data-oid="u2d1xp2">
                    <div className="notification-title" data-oid="2lqe.ud">
                      알림
                    </div>
                    <div className="notification-count" data-oid="wg:40pa">
                      3
                    </div>
                  </div>
                  <div className="notification-list" data-oid="8w9bv7r">
                    <div
                        className="notification-item notification-new"
                        data-oid="xzllr9g"
                    >
                      <div className="notification-icon" data-oid="t6pzccj">
                        <img
                            src={fileIcon}
                            alt="File Icon"
                            className="icon"
                            data-oid="v-xr5ix"
                        />
                      </div>
                      <div className="notification-content" data-oid="r2xgw38">
                        <div className="notification-message" data-oid="u4zmrza">
                          회의록 결재가 승인되었습니다.
                        </div>
                        <div className="notification-time" data-oid="79le1g9">
                          방금 전
                        </div>
                      </div>
                    </div>
                    <div
                        className="notification-item notification-new"
                        data-oid="r:jkhyb"
                    >
                      <div className="notification-icon" data-oid="t7.f.dw">
                        <img
                            src={usersIcon}
                            alt="Users Icon"
                            className="icon"
                            data-oid="w4ijwi_"
                        />
                      </div>
                      <div className="notification-content" data-oid="xqf51j.">
                        <div className="notification-message" data-oid="gjgtjo:">
                          이지원님이 문서를 공유했습니다.
                        </div>
                        <div className="notification-time" data-oid="1lo.r0t">
                          10분 전
                        </div>
                      </div>
                    </div>
                    <div className="notification-item" data-oid="t6qid1d">
                      <div className="notification-icon" data-oid="2.cahya">
                        <img
                            src={calendarIcon}
                            alt="Calendar Icon"
                            className="icon"
                            data-oid="t2kqrl2"
                        />
                      </div>
                      <div className="notification-content" data-oid="0w5wib4">
                        <div className="notification-message" data-oid="wrf5u28">
                          내일 13:00 팀 회의가 예정되어 있습니다.
                        </div>
                        <div className="notification-time" data-oid="mnleg01">
                          1시간 전
                        </div>
                      </div>
                    </div>
                    <div className="notification-item" data-oid="chv.jxw">
                      <div className="notification-icon" data-oid="c6cyizi">
                        <img
                            src={fileIcon}
                            alt="File Icon"
                            className="icon"
                            data-oid="b7qhy7."
                        />
                      </div>
                      <div className="notification-content" data-oid="4r77:8z">
                        <div className="notification-message" data-oid="pxi35on">
                          2024년 1분기 사업계획서 기한이 이틀 남았습니다.
                        </div>
                        <div className="notification-time" data-oid="ta03r:y">
                          3시간 전
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="all-notifications" data-oid="kpftnp3">
                    모든 알림 보기
                  </div>
                </div>
            )}
          </div>

          {userProfile ? (
              <>
                <div
                    className="user-profile"
                    onClick={() => onPageChange("mypage")}
                    data-oid="piz:rdy"
                >
                  <div className="avatar-container" data-oid="4ks-vou">
                    <img
                        src={userProfile.picture}
                        alt="User profile"
                        style={{ borderRadius: '50%', width: '28px', height: '28px' }}
                    />
                  </div>
                  <div className="user-name" data-oid="xz4ud-l">
                    {userProfile.name}
                  </div>
                </div>
                <button onClick={handleLogout} className="new-doc-button-text" style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}>
                  로그아웃
                </button>
              </>
          ) : (
              <button onClick={handleGoogleAuth}>Google 로그인</button>
              //<Login onLoginSuccess={handleLoginSuccess} />
          )}
        </div>
        {/* 새 문서 모달 - 3개 필드 */}
        {showNewDocModal && (
            <div className="modal-overlay" onClick={handleNewDocCancel}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>새 문서 만들기</h2>
                  <button className="modal-close" onClick={handleNewDocCancel}>
                    &times;
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="doc-title">제목</label>
                    <input
                        id="doc-title"
                        type="text"
                        className="modal-input"
                        placeholder="문서 제목을 입력하세요 (예: 회의록)"
                        value={newDocData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="doc-description">상세정보</label>
                    <textarea
                        id="doc-description"
                        className="modal-textarea"
                        placeholder="문서에 대한 상세 설명을 입력하세요 (예: 회의 내용을 기록하는 템플릿)"
                        value={newDocData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="doc-tag">태그</label>
                    <select
                        id="doc-tag"
                        className="modal-input"
                        value={newDocData.tag}
                        onChange={(e) => handleInputChange("tag", e.target.value)}
                    >
                        <option value="" disabled>태그를 선택하세요</option>
                        {tabs.slice(1).map(tab => (
                            <option key={tab} value={tab}>{tab}</option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="modal-button cancel" onClick={handleNewDocCancel}>
                    취소
                  </button>
                  <button className="modal-button confirm" onClick={handleNewDocSubmit}>
                    확인
                  </button>
                </div>
              </div>
            </div>
        )}

        {isChatOverlayOpen && (
            <div className="chat-overlay" data-oid="hotwdvh">
              <div className="chat-header" data-oid="ac7x51a">
                <div className="chat-title" data-oid="c90k4.d">
                  채팅
                </div>
                <div className="chat-actions" data-oid="kbkw93h">
                  <div
                      className="chat-close"
                      onClick={() => setIsChatOverlayOpen(false)}
                      data-oid="gy2sd29"
                  >
                    &times;
                  </div>
                </div>
              </div>
              <div className="chat-body" data-oid="ox-xech">
                <div className="chat-messages" data-oid="f:q-y-k">
                  {chatMessages.map((msg, index) => (
                      <div
                          key={index}
                          className={`chat-message ${msg.type}-message`}
                          data-oid="kcf1d-j"
                      >
                        <div className="message-content" data-oid="kov4l5j">
                          {msg.content}
                        </div>
                        <div className="message-time" data-oid="vxyum_h">
                          {msg.time}
                        </div>
                      </div>
                  ))}
                </div>
                <div className="chat-input-area" data-oid="5fntg-x">
                  <input
                      type="text"
                      className="chat-input"
                      placeholder="메시지 입력..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSendMessage();
                        }
                      }}
                      data-oid="36-l_qe"
                  />

                  <button
                      className="chat-send-button"
                      onClick={handleSendMessage}
                      data-oid="1:ctw8c"
                  >
                    전송
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default Header;
