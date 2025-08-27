import type { Template } from "../../hooks/useTemplateUI";


interface Props {
    template: Template;
    onUse: (type: string, title: string) => void;
    onDelete: (rowIndex: number) => void;
    isFixed: boolean;
}

const tagToClassMap: { [key: string]: string } = {
    "회의": "meeting",
    "재정": "finance",
    "행사": "event",
    "보고서": "report",
};

export function TemplateCard({ template, onUse, onDelete, isFixed }: Props) {
    const tagClassName = tagToClassMap[template.tag] || 'default';

    const handleDelete = () => {
        if (template.rowIndex) {
            onDelete(template.rowIndex);
        }
    };

    return (
        <div className="new-template-card">
            {!isFixed && template.rowIndex && (
                <button className="delete-template-button" onClick={handleDelete}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                </button>
            )}
            <div className="new-card-content">
                <div className={`new-card-tag new-${tagClassName}`}>{template.tag}</div>
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