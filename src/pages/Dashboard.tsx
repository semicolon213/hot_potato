import React from "react";
import { useWidgetManagement } from "../hooks/useWidgetManagement";
import WidgetGrid from "../components/Dashboard/WidgetGrid";
import AddWidgetModal from "../components/Dashboard/AddWidgetModal";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
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

  return (
    <div className="main-content ml-[10px]">
      <div className="dashboard-header">
        <h1>대시보드</h1>
        <button className="add-widget-btn" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus"></i>
          위젯 추가
        </button>
      </div>

      <WidgetGrid
        widgets={widgets}
        handleDragStart={handleDragStart}
        handleDragEnter={handleDragEnter}
        handleDrop={handleDrop}
        handleRemoveWidget={handleRemoveWidget}
      />

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