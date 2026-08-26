import type { DocumentSection } from './templateTypes';

interface Props {
  sections: DocumentSection[];
  onToggleSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
}

export function SectionManager({ sections, onToggleSection, onMoveSection }: Props) {
  return (
    <section className="pdf-designer-section-manager">
      <div className="pdf-designer-section-manager__header">
        <h3>Section Visibility</h3>
        <p>Enable, disable, and reorder document sections.</p>
      </div>
      <div className="pdf-designer-section-manager__list">
        {sections.map((section, index) => (
          <div key={section.id} className="pdf-designer-section-manager__item">
            <label className="pdf-designer-section-manager__toggle">
              <input type="checkbox" checked={section.visible} onChange={() => onToggleSection(section.id)} />
              <span>{section.title}</span>
            </label>
            <div className="pdf-designer-section-manager__actions">
              <button type="button" className="btn btn-outline" disabled={index === 0} onClick={() => onMoveSection(section.id, 'up')}>
                Up
              </button>
              <button type="button" className="btn btn-outline" disabled={index === sections.length - 1} onClick={() => onMoveSection(section.id, 'down')}>
                Down
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
