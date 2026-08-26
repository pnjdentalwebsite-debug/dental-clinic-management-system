import { BrandingSettings } from './BrandingSettings';
import { SectionManager } from './SectionManager';
import type { BrandingSettings as BrandingSettingsType, PDFTemplate } from './templateTypes';

interface Props {
  template: PDFTemplate;
  onTemplateChange: (template: PDFTemplate) => void;
}

export function TemplateEditor({ template, onTemplateChange }: Props) {
  const updateTemplate = (nextTemplate: PDFTemplate) => onTemplateChange(nextTemplate);

  const updateBranding = <Key extends keyof BrandingSettingsType>(key: Key, value: BrandingSettingsType[Key]) => {
    updateTemplate({
      ...template,
      branding: {
        ...template.branding,
        [key]: value
      },
      updatedAt: new Date().toISOString()
    });
  };

  const toggleSection = (sectionId: string) => {
    updateTemplate({
      ...template,
      sections: template.sections.map((section) =>
        section.id === sectionId ? { ...section, visible: !section.visible } : section
      ),
      updatedAt: new Date().toISOString()
    });
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const sections = [...template.sections].sort((a, b) => a.order - b.order);
    const index = sections.findIndex((section) => section.id === sectionId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= sections.length) return;
    const next = [...sections];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    updateTemplate({
      ...template,
      sections: next.map((section, sectionIndex) => ({ ...section, order: sectionIndex + 1 })),
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <section className="pdf-designer-template-editor">
      <div className="pdf-designer-template-editor__header">
        <h3>Template Controls</h3>
        <p>Adjust the current template configuration.</p>
      </div>

      <div className="pdf-designer-template-editor__layout">
        <label>
          <span>Page Orientation</span>
          <select value={template.pageOrientation} onChange={(event) => updateTemplate({ ...template, pageOrientation: event.target.value as PDFTemplate['pageOrientation'], updatedAt: new Date().toISOString() })}>
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
        <label>
          <span>Margins</span>
          <select value={template.margins} onChange={(event) => updateTemplate({ ...template, margins: event.target.value as PDFTemplate['margins'], updatedAt: new Date().toISOString() })}>
            <option value="compact">Compact</option>
            <option value="standard">Standard</option>
            <option value="spacious">Spacious</option>
          </select>
        </label>
        <label>
          <span>Header Position</span>
          <select value={template.headerPosition} onChange={(event) => updateTemplate({ ...template, headerPosition: event.target.value as PDFTemplate['headerPosition'], updatedAt: new Date().toISOString() })}>
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="compact">Compact</option>
          </select>
        </label>
      </div>

      <BrandingSettings branding={template.branding} onChange={updateBranding} />

      <SectionManager sections={[...template.sections].sort((a, b) => a.order - b.order)} onToggleSection={toggleSection} onMoveSection={moveSection} />
    </section>
  );
}
