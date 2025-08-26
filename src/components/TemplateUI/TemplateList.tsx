import type { Template } from "../../hooks/useTemplateUI";
import { TemplateCard } from "./TemplateCard";

interface Props {
    templates: Template[];
    onUseTemplate: () => void;
}

export function TemplateList({ templates, onUseTemplate }: Props) {
    return (
        <div className="new-templates-container">
            {templates.map((template, idx) => (
                <TemplateCard
                    key={template.title + idx}
                    template={template}
                    onUse={onUseTemplate}
                />
            ))}
        </div>
    );
}
