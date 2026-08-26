import type { PDFTemplate } from './templateTypes';

interface Props {
  templates: PDFTemplate[];
  activeTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
}

export function TemplateList({ templates, activeTemplateId, onSelectTemplate }: Props) {
  return (
    <section className="pdf-designer-template-list">
      <div className="pdf-designer-template-list__header">
        <h3>Available Templates</h3>
        <p>Open or edit a document template.</p>
      </div>
      <div className="pdf-designer-template-list__items">
        {templates.map((template) => (
          <div key={template.id} className={`pdf-designer-template-list__item ${template.id === activeTemplateId ? 'is-active' : ''}`}>
            <button
              type="button"
              className="pdf-designer-template-list__primary"
              onClick={() => onSelectTemplate(template.id)}
            >
              <strong>{template.name}</strong>
              <span>{formatDocumentType(template.documentType)}</span>
            </button>
            <div className="pdf-designer-template-list__actions">
              <button type="button" className="btn btn-outline" onClick={() => onSelectTemplate(template.id)}>Open</button>
              <button type="button" className="btn btn-outline" onClick={() => onSelectTemplate(template.id)}>Edit</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatDocumentType(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
