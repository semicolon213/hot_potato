import React from "react";
import TemplateCard from "./TemplateCard";

interface Template {
    type: string;
    title: string;
    description: string;
    tag: string;
}

interface TemplateListProps {
    templates: Template[];
    onUseTemplate: (pageName: string) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ templates, onUseTemplate }) => {
    return (
        <div className="new-templates-container">
            {templates.map((template, idx) => (
                <TemplateCard key={idx} template={template} onUseTemplate={onUseTemplate} />
            ))}
        </div>
    );
};

export default TemplateList;
