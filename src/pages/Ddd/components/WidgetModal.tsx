// src/pages/Ddd/components/WidgetModal.tsx
import React from 'react';
import { widgetOptions } from '../constants/widgetOptions';
import type { Widget } from '../hooks/useWidgetManager';

interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widgetType: string) => void;
  currentWidgets: Widget[];
}

const WidgetModal: React.FC<WidgetModalProps> = ({ isOpen, onClose, onAddWidget, currentWidgets }) => {
  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>위젯 선택</h2>
          <button className="close-modal" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="widget-options">
          {widgetOptions.map(option => {
            const isDisabled = (option.type !== 'welcome' && currentWidgets.some(w => w.type === option.type));
            return (
              <div
                key={option.type}
                className={`widget-option ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && onAddWidget(option.type)}
              >
                <i className={option.icon}></i>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WidgetModal;
