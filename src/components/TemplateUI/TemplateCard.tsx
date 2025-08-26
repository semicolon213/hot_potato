import type { Template } from "../../hooks/useTemplateUI";


interface Props {
    template: Template;
    onUse: () => void;
}

const tagToClassMap: { [key: string]: string } = {
    "회의": "meeting",
    "재정": "finance",
    "행사": "event",
    "보고서": "report",
};

export function TemplateCard({ template, onUse }: Props) {
    const tagClassName = tagToClassMap[template.tag] || 'default';

    return (
        <div className="new-template-card">
            <div className="new-card-content">
                <div className={`new-card-tag new-${tagClassName}`}>{template.tag}</div>
                <h3 className="new-card-title">{template.title}</h3>
                <p className="new-card-description">{template.description}</p>
            </div>
            <div className="new-card-footer">
                <button
                    className="new-use-button"
                    onClick={() => onUse()}
                >
                    사용하기
                </button>
            </div>
        </div>
    );
}