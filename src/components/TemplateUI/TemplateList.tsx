import {initialTemplates, type Template} from "../../hooks/useTemplateUI";
import { SortableTemplateCard } from "./SortableTemplateCard";

interface Props {
    templates: Template[];
    onUseTemplate: (type: string, title: string) => void;
    onDeleteTemplate: (rowIndex: number) => void;
    onEditTemplate?: (template: Template) => void;
    defaultTags: string[];
}

const fixedTemplateTypes = initialTemplates.map(t => t.type);

export function TemplateList({ templates, onUseTemplate, onDeleteTemplate, onEditTemplate, defaultTags }: Props) {
    return (
        <div className="new-templates-container">
            {templates.map((template) => {
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
                    />
                )
            })}
        </div>
    );
}