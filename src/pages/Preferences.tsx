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
          <div className="settings-section-header">
            <div className="settings-section-icon">🔤</div>
            <div>
              <div className="settings-section-title">폰트 설정</div>
              <p className="settings-section-description">
                원하는 폰트를 선택하세요
              </p>
            </div>
          </div>
          <div className="font-options">
            <div className="font-option">
              <input
                type="radio"
                name="font"
                value="system-ui"
                id="font-system"
                checked={selectedFont === "system-ui"}
                onChange={() => handleFontSelect("system-ui")}
              />
              <label htmlFor="font-system" className="font-label">
                <span className="font-name">기본 폰트</span>
                <span className="font-preview" style={{ fontFamily: "system-ui" }}>
                  Aa 가나다
                </span>
              </label>
            </div>
            <div className="font-option">
              <input
                type="radio"
                name="font"
                value="GmarketSansMedium"
                id="font-gmarket"
                checked={selectedFont === "GmarketSansMedium"}
                onChange={() => handleFontSelect("GmarketSansMedium")}
              />
              <label htmlFor="font-gmarket" className="font-label">
                <span className="font-name">Gmarket Sans</span>
                <span className="font-preview" style={{ fontFamily: "GmarketSansMedium" }}>
                  Aa 가나다
                </span>
              </label>
            </div>
            <div className="font-option">
              <input
                type="radio"
                name="font"
                value="LanaPixel"
                id="font-lana"
                checked={selectedFont === "LanaPixel"}
                onChange={() => handleFontSelect("LanaPixel")}
              />
              <label htmlFor="font-lana" className="font-label">
                <span className="font-name">Lana Pixel</span>
                <span className="font-preview" style={{ fontFamily: "LanaPixel" }}>
                  Aa 가나다
                </span>
              </label>
            </div>
            <div className="font-option">
              <input
                type="radio"
                name="font"
                value="SUITE-Regular"
                id="font-suite"
                checked={selectedFont === "SUITE-Regular"}
                onChange={() => handleFontSelect("SUITE-Regular")}
              />
              <label htmlFor="font-suite" className="font-label">
                <span className="font-name">SUITE</span>
                <span className="font-preview" style={{ fontFamily: "SUITE-Regular" }}>
                  Aa 가나다
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon">🎨</div>
            <div>
              <div className="settings-section-title">테마 설정</div>
              <p className="settings-section-description">
                원하는 테마를 선택하여 인터페이스 색상을 변경하세요
              </p>
            </div>
          </div>

          <div className="theme-options">
            <div
              className={`theme-option ${selectedTheme === "default" ? "active" : ""}`}
              data-theme="default"
              onClick={() => handleThemeSelect("default")}
            >
              <div className="theme-preview">
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#1976d2" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#4caf50" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#ffc107" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#ff3d00" }}
                ></div>
              </div>
              <div className="theme-info">
                <div className="theme-name" style={{ fontFamily: selectedFont }}>구글 테마</div>
                <div className="theme-description" style={{ fontFamily: selectedFont }}>Google Material Design</div>
              </div>
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
                  style={{ backgroundColor: "#8b5cf6" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#a78bfa" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#f3e8ff" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#dc2626" }}
                ></div>
              </div>
              <div className="theme-info">
                <div className="theme-name" style={{ fontFamily: selectedFont }}>보라색 테마</div>
                <div className="theme-description" style={{ fontFamily: selectedFont }}>Purple & Violet</div>
              </div>
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
                  style={{ backgroundColor: "#10b981" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#34d399" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#ecfdf5" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#dc2626" }}
                ></div>
              </div>
              <div className="theme-info">
                <div className="theme-name" style={{ fontFamily: selectedFont }}>초록색 테마</div>
                <div className="theme-description" style={{ fontFamily: selectedFont }}>Emerald & Green</div>
              </div>
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
                  style={{ backgroundColor: "#64748b" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#94a3b8" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#f8fafc" }}
                ></div>
                <div
                  className="preview-color"
                  style={{ backgroundColor: "#dc2626" }}
                ></div>
              </div>
              <div className="theme-info">
                <div className="theme-name" style={{ fontFamily: selectedFont }}>회색 테마</div>
                <div className="theme-description" style={{ fontFamily: selectedFont }}>Slate & Gray</div>
              </div>
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
