import type { Template } from "../../hooks/useTemplateUI";


interface Props {
    template: Template;
    onUse: (type: string, title: string) => void;
}

export function TemplateCard({ template, onUse }: Props) {
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
                    onClick={() => onUse(template.type, template.title)}
                >
                    사용하기
                </button>
            </div>
        </div>
    );
}
