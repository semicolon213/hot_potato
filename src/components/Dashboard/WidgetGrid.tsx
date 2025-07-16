import React from "react";
import "./WidgetGrid.css";

interface WidgetData {
  type: string;
  content: string;
  title: string;
}

interface WidgetGridProps {
  widgets: WidgetData[];
  handleDragStart: (index: number) => void;
  handleDragEnter: (index: number) => void;
  handleDrop: () => void;
  handleRemoveWidget: (type: string) => void;
}

const WidgetGrid: React.FC<WidgetGridProps> = ({
  widgets,
  handleDragStart,
  handleDragEnter,
  handleDrop,
  handleRemoveWidget,
}) => {
  return (
    <div className="widget-grid">
      {widgets.map((widget, index) => (
        <div
          key={widget.type}
          className="widget"
          data-widget-type={widget.type}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragEnd={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="widget-header">
            <h3 dangerouslySetInnerHTML={{ __html: widget.title }}></h3>
            <div className="widget-actions">
              <button
                className="widget-btn"
                onClick={() => handleRemoveWidget(widget.type)}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div dangerouslySetInnerHTML={{ __html: widget.content }}></div>
        </div>
      ))}
    </div>
  );
};

export default WidgetGrid;