// src/pages/Ddd/components/WidgetGrid.tsx
import React from 'react';
import GenericWidget from '../../../components/GenericWidget';
import { getWidgetData } from '../utils/widgetData';
import type { Widget } from '../hooks/useWidgetManager';

interface WidgetGridProps {
  widgets: Widget[];
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDragEnter: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  handleRemoveWidget: (id: string) => void;
}

const renderWidgetContent = (widget: Widget) => {
  const data = getWidgetData(widget.type);
  return <GenericWidget {...data} />;
};

const WidgetGrid: React.FC<WidgetGridProps> = ({ 
    widgets, 
    handleDragStart, 
    handleDragEnter, 
    handleDragLeave, 
    handleDrop, 
    handleDragEnd, 
    handleRemoveWidget 
}) => {
  return (
    <div className="widget-grid">
      {widgets.map((widget, index) => (
        <div
          key={widget.id}
          className="widget"
          draggable={true}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          data-widget-type={widget.type}
        >
          <div className="widget-header">
            <h3>
              <i className={widget.icon}></i> {widget.title}
            </h3>
            <div className="widget-actions">
              {widget.type !== 'welcome' && (
                <button className="widget-btn" onClick={() => handleRemoveWidget(widget.id)}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
          <div className="widget-content">
            {renderWidgetContent(widget)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WidgetGrid;
