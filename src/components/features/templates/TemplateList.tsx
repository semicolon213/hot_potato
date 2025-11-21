import {initialTemplates, type Template} from "../../../hooks/features/templates/useTemplateUI";
import { SortableTemplateCard } from "./SortableTemplateCard";
import { BiLoaderAlt } from "react-icons/bi";

interface Props {
    templates: Template[];
    onUseTemplate: ((type: string, title: string) => void) | ((template: Template) => void);
    onDeleteTemplate: (template: Template) => void; // 템플릿 삭제 함수 (기본/개인)
    onEditTemplate?: (template: Template) => void;
    onEditPersonal?: (template: Template) => void; // 개인 템플릿 수정 함수
    defaultTags: string[];
    onToggleFavorite: (template: Template) => void;
    isLoading?: boolean;
    isAdmin?: boolean; // 관리자 여부
}

const fixedTemplateTypes = initialTemplates.map(t => t.type);

export function TemplateList({ templates, onUseTemplate, onDeleteTemplate, onEditTemplate, onEditPersonal, defaultTags, onToggleFavorite, isLoading, isAdmin = false }: Props) {
    return (
        <div className="new-templates-container">
            {isLoading ? (
              <div className="loading-cell" style={{ gridColumn: '1 / -1' }}>
                <BiLoaderAlt className="spinner" />
                <span>로딩 중...</span>
              </div>
            ) : templates.map((template) => {
                const isFixed = fixedTemplateTypes.includes(template.type);
                const isPersonal = template.isPersonal; // 개인 템플릿 여부 확인
                const id = template.rowIndex ? template.rowIndex.toString() : template.title;

                // Enhance template with documentId from localStorage if not already present
                const storageKey = `template_doc_id_${template.title}`;
                const storedDocId = localStorage.getItem(storageKey);
                const templateWithDocId = {
                    ...template,
                    documentId: template.documentId || storedDocId || undefined
                };

                // 즐겨찾기 상태 확인 (디버깅용)
                const favoriteStatus = !!template.favoritesTag;
                if (favoriteStatus) {
                    console.log('⭐ TemplateList 즐겨찾기 템플릿:', template.title, 'favoritesTag:', template.favoritesTag);
                }

                return (
                    <SortableTemplateCard
                        key={id}
                        id={id}
                        template={templateWithDocId} // Pass the enhanced template
                        onUse={onUseTemplate}
                        onDelete={() => {}} // 더 이상 사용하지 않음 (onDeleteTemplate 사용)
                        onDeleteTemplate={onDeleteTemplate} // 템플릿 삭제 함수 전달
                        onEdit={isPersonal ? undefined : onEditTemplate} // 개인 템플릿은 편집 불가
                        onEditPersonal={isPersonal ? onEditPersonal : undefined} // 개인 템플릿 수정 함수
                        isFixed={isFixed || isPersonal} // 개인 템플릿도 고정 템플릿으로 처리
                        defaultTags={defaultTags}
                        onToggleFavorite={onToggleFavorite}
                        isFavorite={favoriteStatus}
                        isAdmin={isAdmin}
                    />
                )
            })}
        </div>
    );
}
