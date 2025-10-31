import React, { useState, useEffect, useRef } from "react";
import type { Template } from "../../../hooks/features/templates/useTemplateUI";
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { BiTrash, BiDotsVerticalRounded, BiEdit } from "react-icons/bi";

interface Props {
    template: Template;
    onUse: (type: string, title: string) => void;
    onDelete: (rowIndex: number) => void;
    onDeleteTemplate?: (template: Template) => void; // 템플릿 삭제 함수 (기본/개인)
    onEdit?: (template: Template) => void; // Make optional
    onEditPersonal?: (template: Template) => void; // 개인 템플릿 수정 함수
    isFixed: boolean;
    defaultTags: string[];
    style?: React.CSSProperties;
    attributes?: DraggableAttributes;
    listeners?: DraggableSyntheticListeners;
    onToggleFavorite?: (template: Template) => void; // 즐겨찾기 토글 함수
    isFavorite?: boolean; // 즐겨찾기 상태
    allowFormEdit?: boolean; // 양식 내용 수정 버튼 노출 여부
    isAdmin?: boolean; // 관리자 여부
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
    ({ template, onUse, onDelete, onDeleteTemplate, onEdit, onEditPersonal, isFixed, defaultTags, style, attributes, listeners, onToggleFavorite, isFavorite, allowFormEdit = true, isAdmin = false }, ref) => {
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const menuRef = useRef<HTMLDivElement>(null);

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
            setIsMenuOpen(false); // Close menu after action
        };

        const handleEditForm = () => {
            if (template.documentId) {
                window.open(`https://docs.google.com/document/d/${template.documentId}/edit`, '_blank');
            }
            setIsMenuOpen(false); // Close menu after action
        };

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                    setIsMenuOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, [menuRef]);

        return (
            <div ref={ref} style={style} className="new-template-card">
                {/* 파일 타입 표시 (기본 템플릿 및 개인 템플릿 모두) */}
                {template.mimeType && (
                    <div className="file-type-badge" title={
                        template.mimeType?.includes('spreadsheet') || template.mimeType?.includes('sheet') 
                            ? '스프레드시트' 
                            : '문서'
                    }>
                        {template.mimeType?.includes('spreadsheet') || template.mimeType?.includes('sheet') 
                            ? '📊' 
                            : '📄'}
                    </div>
                )}
                
                {!isFixed && template.rowIndex && (
                    <div className="card-icon-group">
                        <div className="options-menu-container" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} title="더보기" className="card-action-button">
                                <BiDotsVerticalRounded />
                            </button>
                            {isMenuOpen && (
                                <div className="options-menu">
                                    <div className="options-menu-item" onClick={handleEdit}>정보 수정</div>
                                    {allowFormEdit && template.documentId && (
                                        <div className="options-menu-item" onClick={handleEditForm}>양식 수정</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 삭제 버튼 (휴지통 아이콘) */}
                        <button onClick={handleDelete} title="삭제" className="delete-template-button">
                            <BiTrash />
                        </button>
                    </div>
                )}
                <div className="new-card-content" {...attributes} {...listeners}>
                    <div className="new-card-tag-container">
                        <div className={`new-card-tag new-${tagClassName}`}>{template.tag}</div>
                    </div>
                    <h3 className="new-card-title">{template.title}</h3>
                    <p className="new-card-description">{template.partTitle || template.description}</p>
                </div>
                <div className="new-card-footer">
                    {/* 기본 템플릿 삭제 버튼 (관리자 전용, 왼쪽 하단, 빈 문서 제외) */}
                    {!template.isPersonal && !isFixed && onDeleteTemplate && isAdmin && 
                     template.type !== 'empty' && template.title !== '빈 문서' && (
                        <button
                            className="delete-template-button-footer"
                            onClick={() => {
                                if (window.confirm(`"${template.title}" 기본 템플릿을 삭제하시겠습니까?`)) {
                                    onDeleteTemplate(template);
                                }
                            }}
                            title="기본 템플릿 삭제 (관리자)"
                        >
                            <BiTrash />
                        </button>
                    )}
                    {/* 개인 템플릿 삭제 버튼 (일반 사용자, 왼쪽 하단) */}
                    {template.isPersonal && onDeleteTemplate && (
                        <button
                            className="delete-template-button-footer"
                            onClick={() => {
                                if (window.confirm(`"${template.title}" 개인 템플릿을 삭제하시겠습니까?`)) {
                                    onDeleteTemplate(template);
                                }
                            }}
                            title="개인 템플릿 삭제"
                        >
                            <BiTrash />
                        </button>
                    )}
                    {onToggleFavorite && (
                        <button
                            className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
                            onClick={() => onToggleFavorite(template)}
                            title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="feather feather-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                    )}
                    {/* 개인 템플릿 수정 버튼 */}
                    {template.isPersonal && onEditPersonal && (
                        <button
                            className="edit-personal-button"
                            onClick={() => onEditPersonal(template)}
                            title="개인 템플릿 수정"
                        >
                            <BiEdit />
                        </button>
                    )}
                    {/* 기본 템플릿 수정 버튼 (관리자 전용) */}
                    {!template.isPersonal && !isFixed && onEdit && (
                        <button
                            className="edit-personal-button"
                            onClick={() => onEdit(template)}
                            title="기본 템플릿 수정 (관리자)"
                        >
                            <BiEdit />
                        </button>
                    )}
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
