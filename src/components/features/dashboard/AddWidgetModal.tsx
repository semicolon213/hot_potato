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

  // 위젯을 카테고리별로 분류
  const categorizeWidgets = (options: WidgetOption[]) => {
    const categories: Record<string, WidgetOption[]> = {
      '공지/일정': [],
      '회계': [],
      '관리': [],
      '기타': []
    };

    options.forEach(option => {
      if (['notice', 'calendar', 'timetable'].includes(option.type)) {
        categories['공지/일정'].push(option);
      } else if (['tuition', 'budget-plan', 'budget-execution', 'accounting-stats'].includes(option.type)) {
        categories['회계'].push(option);
      } else if (['student-summary', 'staff-summary', 'user-approval', 'system-stats', 'document-management', 'workflow-status'].includes(option.type)) {
        categories['관리'].push(option);
      } else {
        categories['기타'].push(option);
      }
    });

    // 빈 카테고리 제거
    return Object.entries(categories).filter(([_, widgets]) => widgets.length > 0);
  };

  const categorizedWidgets = categorizeWidgets(widgetOptions);

  return (
    <div className="add-widget-modal-overlay" onClick={() => setIsModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>위젯 추가</h2>
          <button className="close-modal" onClick={() => setIsModalOpen(false)}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="widget-options-container">
            {categorizedWidgets.map(([category, categoryWidgets]) => (
              <div key={category} className="widget-options">
                {categoryWidgets.map((option) => {
                  // 세부 선택이 있는 위젯은 여러 개 추가 가능하므로 항상 활성화
                  const widgetsWithSelection = ['budget-plan', 'budget-execution', 'accounting-stats'];
                  const canHaveMultiple = widgetsWithSelection.includes(option.type);
                  const isDisabled = !canHaveMultiple && widgets.some((w) => w.type === option.type) && option.type !== "welcome";
                  
                  return (
                    <div
                      key={option.type}
                      className={`widget-option ${isDisabled ? "disabled" : ""}`}
                      onClick={() => !isDisabled && handleAddWidget(option.type)}
                    >
                      <i className={option.icon}></i>
                      <h3>{option.title}</h3>
                      <p>{option.description}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWidgetModal;