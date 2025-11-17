import React, { useState, useEffect } from "react";
import "../styles/pages/Dashboard.css";
import WidgetGrid from "../components/features/dashboard/WidgetGrid";
import AddWidgetModal from "../components/features/dashboard/AddWidgetModal";
import SheetSelectionModal from "../components/ui/SheetSelectionModal";
import type { User } from '../../types/app';
import { useWidgetManagement } from "../hooks/features/dashboard/useWidgetManagement";

interface DashboardProps {
  user: User | null;
  hotPotatoDBSpreadsheetId: string | null;
  onPageChange?: (pageName: string, params?: Record<string, string>) => void;
  onSelectAnnouncement?: (post: { id: string; title: string }) => void;
  announcements?: Array<{ id: string; title: string }>;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  hotPotatoDBSpreadsheetId, 
  onPageChange, 
  onSelectAnnouncement, 
  announcements
}) => {
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
    isSheetModalOpen,
    setIsSheetModalOpen,
    accountingSheets,
    openSheetSelectionModal,
    handleSheetSelect,
    handleStudentStatusChange,
  } = useWidgetManagement(hotPotatoDBSpreadsheetId, user);

  useEffect(() => {
    console.log("Dashboard 컴포넌트가 마운트되었습니다.");
    console.log("현재 위젯 개수:", widgets.length);
    
    if (widgets.length > 0 || !hotPotatoDBSpreadsheetId) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
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

      {widgets.length === 0 ? (
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
          onWidgetButtonClick={(widgetId) => openSheetSelectionModal(widgetId)}
          onStudentStatusChange={handleStudentStatusChange}
          onPageChange={onPageChange}
          onSelectAnnouncement={onSelectAnnouncement}
          announcements={announcements}
        />
      )}

      <AddWidgetModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        widgetOptions={widgetOptions}
        widgets={widgets}
        handleAddWidget={handleAddWidget}
      />

      <SheetSelectionModal
        isOpen={isSheetModalOpen}
        sheets={accountingSheets}
        onClose={() => setIsSheetModalOpen(false)}
        onSelect={handleSheetSelect}
      />
    </div>
  );
};

export default Dashboard;