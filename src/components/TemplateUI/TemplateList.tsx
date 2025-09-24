import {initialTemplates, type Template} from "../../hooks/useTemplateUI";
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
                <span>템플릿을 가져오는 중입니다...</span>
              </div>
            ) : templates.map((template) => {
                const isFixed = fixedTemplateTypes.includes(template.type);
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
                        onDelete={onDeleteTemplate}
                        onEdit={onEditTemplate}
                        isFixed={isFixed}
                        defaultTags={defaultTags}
                        onToggleFavorite={onToggleFavorite}
                        isFavorite={!!template.favorites_tag}
                    />
                )
            })}
        </div>
    );
}
