import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
  panelClassName?: string;
}

export function MasterFileFormSection({
  title,
  description,
  children,
  panelClassName
}: Props) {
  return (
    <section className={`master-file-record-modal__panel ${panelClassName || ''}`.trim()}>
      <div className="master-file-record-modal__section">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
