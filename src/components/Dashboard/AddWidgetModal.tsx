import React from "react";
import "./AddWidgetModal.css";

interface WidgetOption {
  type: string;
  icon: string;
  title: string;
  description: string;
}

interface AddWidgetModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  widgetOptions: WidgetOption[];
  widgets: { type: string }[]; // Simplified for checking existing widgets
  handleAddWidget: (type: string) => void;
}

const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
  isModalOpen,
  setIsModalOpen,
  widgetOptions,
  widgets,
  handleAddWidget,
}) => {
  if (!isModalOpen) return null;

  return (
    <div className="modal" style={{ display: "flex" }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>위젯 추가 (20가지)</h2>
          <button className="close-modal" onClick={() => setIsModalOpen(false)}>
            &times;
          </button>
        </div>
        <div className="widget-options">
          {widgetOptions.map((option) => (
            <div
              key={option.type}
              className={`widget-option ${widgets.some((w) => w.type === option.type) && option.type !== "welcome" ? "disabled" : ""}`}
              onClick={() => handleAddWidget(option.type)}
            >
              <i className={option.icon}></i>
              <h3>{option.title}</h3>
              <p>{option.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddWidgetModal;