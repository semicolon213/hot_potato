import React from "react";
import "../styles/pages/Dashboard.css";
import WidgetGrid from "../components/features/dashboard/WidgetGrid";
import AddWidgetModal from "../components/features/dashboard/AddWidgetModal";
import type { User, WidgetData, WidgetOption } from '../../types/app';

interface DashboardProps {
  user: User | null;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  widgets: WidgetData[];
  handleAddWidget: (type: string) => void;
  handleRemoveWidget: (id: string) => void;
  handleDragStart: (index: number) => void;
  handleDragEnter: (index: number) => void;
  handleDrop: () => void;
  widgetOptions: WidgetOption[];
}

const Dashboard: React.FC<DashboardProps> = ({
  user,
  isModalOpen,
  setIsModalOpen,
  widgets,
  handleAddWidget,
  handleRemoveWidget,
  handleDragStart,
  handleDragEnter,
  handleDrop,
  widgetOptions,
}) => {
  // The loading state is now implicitly handled by the parent component.
  // The dashboard will render the empty state until the `widgets` array is populated.

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