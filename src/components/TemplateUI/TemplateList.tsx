import {initialTemplates, type Template} from "../../hooks/useTemplateUI";
import { TemplateCard } from "./TemplateCard";

interface Props {
    templates: Template[];
    onUseTemplate: (type: string, title: string) => void;
    onDeleteTemplate: (rowIndex: number) => void;
}

const fixedTemplateTypes = initialTemplates.map(t => t.type);

export function TemplateList({ templates, onUseTemplate, onDeleteTemplate }: Props) {
    return (
        <div className="new-templates-container">
            {templates.map((template, idx) => {
                const isFixed = fixedTemplateTypes.includes(template.type);
                return (
                    <TemplateCard
                        key={template.title + idx}
                        template={template}
                        onUse={onUseTemplate}
                        onDelete={onDeleteTemplate}
                        isFixed={isFixed}
                    />
                )
            })}
        </div>
    );
}