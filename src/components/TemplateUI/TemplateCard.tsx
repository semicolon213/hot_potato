import React from "react";
import type { Template } from "../../hooks/useTemplateUI";
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';

interface Props {
    template: Template;
    onUse: (type: string, title: string) => void;
    onDelete: (rowIndex: number) => void;
    onEdit?: (template: Template) => void; // Make optional
    isFixed: boolean;
    defaultTags: string[];
    style?: React.CSSProperties;
    attributes?: DraggableAttributes;
    listeners?: DraggableSyntheticListeners;
}

const tagToClassMap: { [key: string]: string } = {
    "회의": "meeting",
    "재정": "finance",
    "증명": "certification",
    "행사": "event",
    "보고서": "report",
};

function getCustomTagColorClass(tagName: string): string {
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
        const char = tagName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char; // hash * 31 + char
        hash |= 0; // Convert to 32bit integer
    }
    const index = Math.abs(hash % 10);
    return `custom-color-${index}`;
}

export const TemplateCard = React.forwardRef<HTMLDivElement, Props>(
    ({ template, onUse, onDelete, onEdit, isFixed, defaultTags, style, attributes, listeners }, ref) => {
        const isDefaultTag = defaultTags.includes(template.tag);
        const tagClassName = isDefaultTag
            ? tagToClassMap[template.tag] || 'default'
            : getCustomTagColorClass(template.tag);

        const handleDelete = () => {
            if (template.rowIndex) {
                onDelete(template.rowIndex);
            }
        };

        const handleEdit = () => {
            if (onEdit) {
                onEdit(template);
            }
        };

        return (
            <div ref={ref} style={style} className="new-template-card">
                {!isFixed && template.rowIndex && (
                    <>
                        <button className="edit-template-button" onClick={handleEdit}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                            </svg>
                        </button>
                        <button className="delete-template-button" onClick={handleDelete}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>
                    </>
                )}
                <div className="new-card-content" {...attributes} {...listeners}>
                    <div className={`new-card-tag new-${tagClassName}`}>{template.tag}</div>
                    <h3 className="new-card-title">{template.title}</h3>
                    <p className="new-card-description">{template.parttitle || template.description}</p>
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
);