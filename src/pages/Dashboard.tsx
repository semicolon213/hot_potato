import React, { useState, useEffect } from "react";
import { useWidgetManagement } from "../hooks/useWidgetManagement";
import "./Dashboard.css";
import WidgetGrid from "../components/Dashboard/WidgetGrid";
import AddWidgetModal from "../components/Dashboard/AddWidgetModal";


const Dashboard: React.FC = () => {
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
  } = useWidgetManagement();

  useEffect(() => {
    console.log("Dashboard 컴포넌트가 마운트되었습니다.");
    console.log("현재 위젯 개수:", widgets.length);
    
    // 5초 후 로딩 상태 해제
    const timer = setTimeout(() => {
      console.log("로딩 타이머가 만료되었습니다. 위젯 개수:", widgets.length);
      setIsLoading(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [widgets.length]);

  return (
    <div className="main-content ml-[10px]">
      <div className="dashboard-header">
        <h1>대시보드</h1>
        <button className="add-widget-btn" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus"></i>
          위젯 추가
        </button>
      </div>

      {isLoading ? (
        <div className="empty-dashboard">
          <div className="empty-message">
            <i className="fas fa-spinner fa-spin"></i>
            <h3>위젯을 불러오는 중...</h3>
            <p>Google Sheets에서 위젯 데이터를 로드하고 있습니다.</p>
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