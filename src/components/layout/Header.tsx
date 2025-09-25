import React, { useState, useEffect } from "react";
import "./Header.css";
import {
  searchIcon,
  fileIcon,
  usersIcon,
  calendarIcon,
} from "../../assets/Icons";
import { BiSolidChat, BiSolidBell } from "react-icons/bi";

import { useAuthStore } from "../../hooks/features/auth/useAuthStore";

// Define the structure of the user profile object
interface UserProfile {
  name: string;
  picture: string;
  email: string;
}

interface HeaderProps {
  onPageChange: (pageName: string) => void;
  userInfo?: {
    name: string;
    email: string;
    isAdmin: boolean;
  };
  onLogout?: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit: () => void;
}

const Header: React.FC<HeaderProps> = ({ onPageChange, userInfo, onLogout, searchTerm, onSearchChange, onSearchSubmit }) => {
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

  const { user: authUser, logout } = useAuthStore();

  // Check for logged-in user on component mount
  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
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

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isNotificationPanelOpen]);

  // Determine which user info to display
  const displayUser = userInfo || authUser || userProfile;

  return (
      <div className="header" data-oid="klo-qi-">

        <div className="search-container" data-oid="ztfgwty">
          <img
              src={searchIcon}
              alt="Search Icon"
              className="icon"
              data-oid="i8vx3cc"
          />

          <input
              type="text"
              className="search-inputbox"
              placeholder="문서 검색"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  onSearchSubmit();
                }
              }}
              data-oid="750ewi9"
          />
        </div>

        <div className="header-actions" data-oid="xq1uhkt">
          <div
              className="bell-button"
              onClick={handleNotificationClick}
              data-oid="gglwxgo"
          >
            <BiSolidBell className="icon" />

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

          {displayUser ? (
              <>
                <button className="user-button" onClick={() => onPageChange("mypage")} data-oid="piz:rdy">
                  {displayUser.name}
                </button>
                <button onClick={handleLogout} className="logout-button">
                  로그아웃
                </button>
              </>
          ) : (
              <button onClick={() => onPageChange("login")}>Google 로그인</button>
          )}
        </div>


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
