import React, { useState, useEffect } from "react";
import "./Preferences.css";

interface PreferencesProps {
  onPageChange: (pageName: string) => void;
}

const Preferences: React.FC<PreferencesProps> = ({ onPageChange }) => {
  const [selectedTheme, setSelectedTheme] = useState<string>(
    localStorage.getItem("selectedTheme") || "default",
  );
  const [selectedFont, setSelectedFont] = useState<string>(
    localStorage.getItem("selectedFont") || "system-ui",
  );

  useEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  useEffect(() => {
    applyFont(selectedFont);
  }, [selectedFont]);

  const applyTheme = (theme: string) => {
    document.body.classList.remove(
      "theme-default",
      "theme-purple",
      "theme-green",
      "theme-brown",
      "theme-gray",
    );
    if (theme !== "default") {
      document.body.classList.add(`theme-${theme}`);
    }
    localStorage.setItem("selectedTheme", theme);
  };

  const applyFont = (font: string) => {
    document.documentElement.style.setProperty("--main-font", font);
    localStorage.setItem("selectedFont", font);
  };

  const handleThemeSelect = (theme: string) => {
    setSelectedTheme(theme);
  };

  const handleFontSelect = (font: string) => {
    setSelectedFont(font);
  };

  const handleSaveSettings = () => {
    applyTheme(selectedTheme);
    applyFont(selectedFont);
    alert("설정이 저장되었습니다.");
  };

  const handleCancel = () => {
    // Revert to the theme and font before changes or navigate away
    const initialTheme = localStorage.getItem("selectedTheme") || "default";
    const initialFont = localStorage.getItem("selectedFont") || "system-ui";
    applyTheme(initialTheme);
    applyFont(initialFont);
    onPageChange("ddd"); // Navigate back to a default page, e.g., ddd
  };

  return (
    <div className="content">
      <div className="settings-container">
        <div className="settings-header">
          <h1>환경설정</h1>
          <p>인터페이스 및 개인 설정을 관리하세요</p>
        </div>

        {/* 폰트 설정 섹션 */}
        <div className="settings-section">
          <div className="settings-section-title">폰트 설정</div>
          <p className="settings-section-description">
            원하는 폰트를 선택하세요
          </p>
          <div className="font-options">
            <label style={{ marginRight: "20px" }}>
              <input
                type="radio"
                name="font"
                value="system-ui"
                checked={selectedFont === "system-ui"}
                onChange={() => handleFontSelect("system-ui")}
              />
              기본 폰트
            </label>
            <label style={{ marginRight: "20px" }}>
              <input
                type="radio"
                name="font"
                value="GmarketSansMedium"
                checked={selectedFont === "GmarketSansMedium"}
                onChange={() => handleFontSelect("GmarketSansMedium")}
              />
              GmarketSansMedium
            </label>
            <label style={{ marginRight: "20px" }}>
              <input
                type="radio"
                name="font"
                value="LanaPixel"
                checked={selectedFont === "LanaPixel"}
                onChange={() => handleFontSelect("LanaPixel")}
              />
              LanaPixel
            </label>
            <label style={{ marginRight: "20px" }}>
              <input
                type="radio"
                name="font"
                value="SUITE-Regular"
                checked={selectedFont === "SUITE-Regular"}
                onChange={() => handleFontSelect("SUITE-Regular")}
              />
              SUITE-Regular
            </label>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">테마 설정</div>
          <p className="settings-section-description">
            원하는 테마를 선택하여 인터페이스 색상을 변경하세요
          </p>

          <div className="theme-options">
            <div
              className={`theme-option ${selectedTheme === "default" ? "active" : ""}`}
              data-theme="default"
              onClick={() => handleThemeSelect("default")}
            >
              <div className="theme-preview">
                <div
                  className="preview-color"
                  style={{ backgroundColor: "rgb(56, 67, 86)" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "rgb(103, 123, 139)" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "rgb(200, 211, 228)" }}
                ></div>
              </div>
              <div className="theme-name">기본 테마</div>
              <div className="theme-selected">
                <div className="checkmark"></div>
              </div>
            </div>

            <div
              className={`theme-option ${selectedTheme === "purple" ? "active" : ""}`}
              data-theme="purple"
              onClick={() => handleThemeSelect("purple")}
            >
              <div className="theme-preview">
                <div
                  className="preview-color"
                  style={{ backgroundColor: "rgb(77, 76, 125)" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "rgb(130, 115, 151)" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "rgb(233, 213, 218)" }}
                ></div>
              </div>
              <div className="theme-name">보라색 테마</div>
              <div className="theme-selected">
                <div className="checkmark"></div>
              </div>
            </div>

            <div
              className={`theme-option ${selectedTheme === "green" ? "active" : ""}`}
              data-theme="green"
              onClick={() => handleThemeSelect("green")}
            >
              <div className="theme-preview">
                <div
                  className="preview-color"
                  style={{ backgroundColor: "rgb(98, 110, 86)" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "rgb(161, 179, 149)" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "rgb(242, 243, 236)" }}
                ></div>
              </div>
              <div className="theme-name">초록색 테마</div>
              <div className="theme-selected">
                <div className="checkmark"></div>
              </div>
            </div>

            <div
              className={`theme-option ${selectedTheme === "brown" ? "active" : ""}`}
              data-theme="brown"
              onClick={() => handleThemeSelect("brown")}
            >
              <div className="theme-preview">
                <div
                  className="preview-color"
                  style={{ backgroundColor: "rgb(73, 54, 40)" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "rgb(171, 136, 109)" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#d7ccc8" }}
                ></div>
              </div>
              <div className="theme-name">갈색 테마</div>
              <div className="theme-selected">
                <div className="checkmark"></div>
              </div>
            </div>

            <div
              className={`theme-option ${selectedTheme === "gray" ? "active" : ""}`}
              data-theme="gray"
              onClick={() => handleThemeSelect("gray")}
            >
              <div className="theme-preview">
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#444444" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#777777" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#cccccc" }}
                ></div>
              </div>
              <div className="theme-name">회색 테마</div>
              <div className="theme-selected">
                <div className="checkmark"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button
            className="settings-button cancel-button"
            onClick={handleCancel}
          >
            취소
          </button>
          <button
            className="settings-button save-button"
            onClick={handleSaveSettings}
          >
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
