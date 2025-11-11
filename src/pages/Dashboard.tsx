import React, { useState, useEffect } from "react";
import { useWidgetManagement } from "../hooks/features/dashboard/useWidgetManagement";
import "../styles/pages/Dashboard.css";
import WidgetGrid from "../components/features/dashboard/WidgetGrid";
import AddWidgetModal from "../components/features/dashboard/AddWidgetModal";
import type { User } from '../../types/app';

interface DashboardProps {
  user: User | null;
  hotPotatoDBSpreadsheetId: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user, hotPotatoDBSpreadsheetId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const {
    isModalOpen,
    setIsModalOpen,
    widgets,
    handleAddWidget,
    handleRemoveWidget,
    handleDragStart,
    handleDragEnter,
    handleDrop,
    widgetOptions,
  } = useWidgetManagement(hotPotatoDBSpreadsheetId, user);

  useEffect(() => {
    console.log("Dashboard 컴포넌트가 마운트되었습니다.");
    console.log("현재 위젯 개수:", widgets.length);
    
    // 위젯이 로드되면 로딩 상태 해제
    if (widgets.length > 0 || !hotPotatoDBSpreadsheetId) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500); // 약간의 딜레이를 주어 자연스러운 로딩 효과
      return () => clearTimeout(timer);
    }
  }, [widgets, hotPotatoDBSpreadsheetId]);

  return (
    <div className="main-content">
      <div className="dashboard-header">
        <button className="add-widget-btn" onClick={() => setIsModalOpen(true)}>
          위젯 추가
        </button>
      </div>

      {isLoading ? (
        <div className="empty-dashboard">
          <div className="empty-message">
            <i className="fas fa-spinner fa-spin"></i>
            <h3>위젯을 불러오는 중...</h3>
            <p>위젯 데이터를 준비하고 있습니다.</p>
          </div>
        </div>
      ) : widgets.length === 0 ? (
        <div className="empty-dashboard">
          <div className="empty-message">
            <i className="fas fa-plus-circle"></i>
            <h3>위젯이 없습니다</h3>
            <p>위젯 추가 버튼을 클릭하여 대시보드를 커스터마이징하세요.</p>
            <button 
              className="add-first-widget-btn" 
              onClick={() => setIsModalOpen(true)}
            >
              첫 번째 위젯 추가하기
            </button>
          </div>
        </div>
      ) : (
        <WidgetGrid
          widgets={widgets}
          handleDragStart={handleDragStart}
          handleDragEnter={handleDragEnter}
          handleDrop={handleDrop}
          handleRemoveWidget={handleRemoveWidget}
        />
      )}

      <AddWidgetModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        widgetOptions={widgetOptions}
        widgets={widgets}
        handleAddWidget={handleAddWidget}
      />
    </div>
  );
};

export default Dashboard;