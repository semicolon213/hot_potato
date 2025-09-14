import React, { useState, useEffect } from "react";
import { useWidgetManagement } from "../hooks/useWidgetManagement";
import "./Dashboard.css";
import WidgetGrid from "../components/Dashboard/WidgetGrid";
import AddWidgetModal from "../components/Dashboard/AddWidgetModal";


const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
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
    syncWidgetsWithGoogleSheets,
  } = useWidgetManagement();

  useEffect(() => {
    console.log("Dashboard 컴포넌트가 마운트되었습니다.");
    console.log("현재 위젯 개수:", widgets.length);
    
    // 1초 후 로딩 상태 해제 (로컬 스토리지 사용으로 빠른 로딩)
    const timer = setTimeout(() => {
      console.log("로딩 타이머가 만료되었습니다. 위젯 개수:", widgets.length);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [widgets.length]);

  return (
    <div className="main-content ml-[10px]">
      <div className="dashboard-header">
        <h1>대시보드</h1>
        <div className="dashboard-actions">
          <button 
            className="sync-btn" 
            onClick={async () => {
              setIsSyncing(true);
              try {
                await syncWidgetsWithGoogleSheets();
              } finally {
                setIsSyncing(false);
              }
            }}
            disabled={isSyncing}
            title="Google Sheets와 동기화"
          >
            <i className={`fas ${isSyncing ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
            {isSyncing ? '동기화 중...' : '동기화'}
          </button>
          <button className="add-widget-btn" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i>
            위젯 추가
          </button>
        </div>
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
            <p>Google 로그인 후 동기화 버튼을 클릭하거나, 위젯 추가 버튼을 클릭하여 대시보드를 커스터마이징하세요.</p>
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