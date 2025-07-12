import React from "react";

interface Template {
    type: string;
    title: string;
    description: string;
    tag: string;
}

interface TemplateCardProps {
    template: Template;
    onUseTemplate: (pageName: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUseTemplate }) => {
    return (
        <div className="new-template-card">
            <div className="new-card-content">
                <div className={`new-card-tag new-${template.type}`}>{template.tag}</div>
                <h3 className="new-card-title">{template.title}</h3>
                <p className="new-card-description">{template.description}</p>
            </div>
            <div className="new-card-footer">
                <button
                    className="new-use-button"
                    onClick={() => {
                        if (template.type === "empty") {
                            onUseTemplate("empty_document");
                        } else {
                            alert(`'${template.title}' 템플릿 사용`);
                        }
                    }}
                >
                    사용하기
                </button>
            </div>
        </div>
    );
};

export default TemplateCard;
