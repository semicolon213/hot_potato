import {initialTemplates, type Template} from "../../../hooks/features/templates/useTemplateUI";
import { SortableTemplateCard } from "./SortableTemplateCard";
import { BiLoaderAlt } from "react-icons/bi";

interface Props {
    templates: Template[];
    onUseTemplate: (type: string, title: string) => void;
    onDeleteTemplate: (rowIndex: number) => void;
    onEditTemplate?: (template: Template) => void;
    defaultTags: string[];
    onToggleFavorite: (template: Template) => void;
    isLoading?: boolean;
}

const fixedTemplateTypes = initialTemplates.map(t => t.type);

export function TemplateList({ templates, onUseTemplate, onDeleteTemplate, onEditTemplate, defaultTags, onToggleFavorite, isLoading }: Props) {
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

                return (
                    <SortableTemplateCard
                        key={id}
                        id={id}
                        template={templateWithDocId} // Pass the enhanced template
                        onUse={onUseTemplate}
                        onDelete={isPersonal ? () => {} : onDeleteTemplate} // 개인 템플릿은 삭제 불가
                        onEdit={isPersonal ? undefined : onEditTemplate} // 개인 템플릿은 편집 불가
                        isFixed={isFixed || isPersonal} // 개인 템플릿도 고정 템플릿으로 처리
                        defaultTags={defaultTags}
                        onToggleFavorite={onToggleFavorite}
                        isFavorite={!!template.favoritesTag || (template.isPersonal && template.favoritesTag)}
                    />
                )
            })}
        </div>
    );
}
