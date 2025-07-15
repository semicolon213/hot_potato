// src/pages/Ddd/Ddd.tsx
import React from 'react';
import './Ddd.css';
import { useWidgetManager } from './hooks/useWidgetManager';
import WidgetGrid from './components/WidgetGrid';
import WidgetModal from './components/WidgetModal';

const Ddd: React.FC = () => {
  const {
    widgets,
    isModalOpen,
    setIsModalOpen,
    handleAddWidget,
    handleRemoveWidget,
    handleDragStart,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useWidgetManager();

  return (
    <div className="main-content">
      <div className="dashboard-header">
        <h1>나의 대시보드</h1>
        <button className="add-widget-btn" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus"></i> 위젯 추가
        </button>
      </div>

      <WidgetGrid
        widgets={widgets}
        handleDragStart={handleDragStart}
        handleDragEnter={handleDragEnter}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        handleDragEnd={handleDragEnd}
        handleRemoveWidget={handleRemoveWidget}
      />

      <WidgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddWidget={handleAddWidget}
        currentWidgets={widgets}
      />
    </div>
  );
};

export default Ddd;
