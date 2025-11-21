import React, { useState, useEffect, useRef } from "react";
import type { Template } from "../../../hooks/features/templates/useTemplateUI";
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { BiTrash, BiDotsVerticalRounded, BiEdit, BiTable, BiFileBlank, BiStar } from "react-icons/bi";

interface Props {
    template: Template;
    onUse: ((type: string, title: string) => void) | ((template: Template) => void);
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
        const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
        const [isSelected, setIsSelected] = useState(false);
        const [isDragging, setIsDragging] = useState(false);
        const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
        const menuRef = useRef<HTMLDivElement>(null);
        const contextMenuRef = useRef<HTMLDivElement>(null);

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
                if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                    setContextMenu(null);
                }
            };
            if (isMenuOpen || contextMenu) {
                document.addEventListener("mousedown", handleClickOutside);
            }
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, [isMenuOpen, contextMenu]);

        const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY });
        };

        const handleToggleFavorite = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu(null);
            if (onToggleFavorite) {
                onToggleFavorite(template);
            }
        };

        const handleEditTemplate = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu(null);
            if (template.isPersonal && onEditPersonal) {
                onEditPersonal(template);
            } else if (!template.isPersonal && onEdit) {
                onEdit(template);
            }
        };

        const handleDeleteTemplate = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu(null);
            if (onDeleteTemplate) {
                if (window.confirm(
                    template.isPersonal 
                        ? `"${template.title}" 개인 템플릿을 삭제하시겠습니까?`
                        : `"${template.title}" 기본 템플릿을 삭제하시겠습니까?`
                )) {
                    onDeleteTemplate(template);
                }
            }
        };

        const handleMouseDown = (e: React.MouseEvent) => {
            // 드래그 시작 위치 저장
            if (!isFixed && listeners) {
                setDragStartPos({ x: e.clientX, y: e.clientY });
                setIsDragging(false);
            }
        };

        const handleMouseMove = (e: React.MouseEvent) => {
            // 드래그가 실제로 시작되었는지 확인 (8px 이상 이동)
            if (dragStartPos && !isFixed && listeners) {
                const distance = Math.sqrt(
                    Math.pow(e.clientX - dragStartPos.x, 2) + 
                    Math.pow(e.clientY - dragStartPos.y, 2)
                );
                if (distance > 8) {
                    setIsDragging(true);
                }
            }
        };

        const handleCardClick = (e: React.MouseEvent) => {
            // 드래그가 시작된 경우 클릭 무시
            if (isDragging) {
                setIsDragging(false);
                setDragStartPos(null);
                return;
            }

            // 컨텍스트 메뉴가 열려있거나, 컨텍스트 메뉴 영역을 클릭한 경우 무시
            if (contextMenu || contextMenuRef.current?.contains(e.target as Node)) {
                return;
            }
            // 액션 버튼이나 메뉴를 클릭한 경우 무시
            if (menuRef.current?.contains(e.target as Node) || 
                (e.target as HTMLElement).closest('.card-action-button, .delete-template-button, .options-menu')) {
                return;
            }
            // 파일 타입 배지나 즐겨찾기 버튼을 클릭한 경우 무시
            if ((e.target as HTMLElement).closest('.file-type-badge, .favorite-badge-button')) {
                return;
            }
            
            // 선택 효과 표시
            setIsSelected(true);
            setTimeout(() => {
                setIsSelected(false);
            }, 300);
            
            // 템플릿 사용 - 템플릿 객체를 직접 전달
            // handleUseTemplateClick이 템플릿 객체를 받을 수 있으므로 직접 전달
            console.log('📄 TemplateCard 클릭:', template);
            const onUseFn = onUse as any;
            // 템플릿 객체를 직접 전달 (handleUseTemplateClick이 객체인지 확인함)
            onUseFn(template);
            
            // 클릭 후 상태 초기화
            setDragStartPos(null);
        };

        return (
            <div 
                ref={ref} 
                style={style} 
                className={`new-template-card ${contextMenu ? 'context-menu-open' : ''} ${isSelected ? 'selected' : ''}`}
                onContextMenu={handleContextMenu}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onClick={handleCardClick}
                onMouseEnter={(e) => {
                    // 컨텍스트 메뉴가 열려있을 때는 호버 효과로 인한 이벤트 무시
                    if (contextMenu) {
                        e.stopPropagation();
                    }
                }}
            >
                {/* 파일 타입 표시 (기본 템플릿 및 개인 템플릿 모두) */}
                {template.mimeType && (
                    <>
                        {/* 즐겨찾기 버튼 */}
                        {onToggleFavorite && (
                            <button
                                className={`favorite-badge-button ${isFavorite ? 'favorited' : ''}`}
                                title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (onToggleFavorite) {
                                        onToggleFavorite(template);
                                    }
                                }}
                            >
                                <BiStar />
                            </button>
                        )}
                        <div className="file-type-badge" title={
                            template.mimeType?.includes('spreadsheet') || template.mimeType?.includes('sheet') 
                                ? '스프레드시트' 
                                : '문서'
                        }>
                            {template.mimeType?.includes('spreadsheet') || template.mimeType?.includes('sheet') 
                                ? <BiTable /> 
                                : <BiFileBlank />}
                        </div>
                    </>
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
                    <h3 className="new-card-title">
                        {template.title}
                    </h3>
                    <p className="new-card-description">{template.partTitle || template.description}</p>
                </div>

                {/* 컨텍스트 메뉴 */}
                {contextMenu && (
                    <div
                        ref={contextMenuRef}
                        className="template-context-menu"
                        style={{
                            position: 'fixed',
                            top: contextMenu.y,
                            left: contextMenu.x,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={(e) => e.stopPropagation()}
                        onMouseLeave={(e) => e.stopPropagation()}
                    >
                        {(template.isPersonal && onEditPersonal) || (!template.isPersonal && !isFixed && onEdit) ? (
                            <button
                                type="button"
                                className="template-context-menu-item"
                                onClick={handleEditTemplate}
                            >
                                <BiEdit />
                                수정
                            </button>
                        ) : null}
                        {onDeleteTemplate && 
                         ((template.isPersonal) || 
                          (!template.isPersonal && !isFixed && isAdmin && template.type !== 'empty' && template.title !== '빈 문서')) ? (
                            <>
                                {((template.isPersonal && onEditPersonal) || (!template.isPersonal && !isFixed && onEdit)) && (
                                    <div className="template-context-menu-divider"></div>
                                )}
                                <button
                                    type="button"
                                    className="template-context-menu-item template-context-menu-item-danger"
                                    onClick={handleDeleteTemplate}
                                >
                                    <BiTrash />
                                    삭제
                                </button>
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        );
    }
);
