import type { MouseEvent } from 'react';

interface Props {
  toothNumber: string;
  tags: string[];
  onOpen?: (anchorRect: DOMRect) => void;
  interactive?: boolean;
}

const visibleTagCount = 4;

export function DentalProcedureTagBox({
  toothNumber,
  tags,
  onOpen,
  interactive = true
}: Props) {
  const visibleTags = tags.slice(0, visibleTagCount);
  const overflowCount = Math.max(tags.length - visibleTagCount, 0);
  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    onOpen?.(event.currentTarget.getBoundingClientRect());
  };

  const content = (
    <>
      <span className="dental-procedure-box__grid" aria-hidden="true">
        {Array.from({ length: visibleTagCount }, (_, index) => (
          <span key={index} className="dental-procedure-box__cell">
            {visibleTags[index] || ''}
          </span>
        ))}
      </span>
      <span className={`dental-procedure-box__overflow ${overflowCount === 0 ? 'is-empty' : ''}`}>
        {overflowCount > 0 ? `+${overflowCount}` : '\u00a0'}
      </span>
    </>
  );

  if (!interactive) {
    return (
      <div
        className="dental-procedure-box is-readonly"
        aria-label={`Procedure tags for tooth ${toothNumber}`}
        title={`Procedure tags for tooth ${toothNumber}`}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="dental-procedure-box"
      onClick={handleOpen}
      aria-label={`Open procedures and tags for tooth ${toothNumber}`}
      aria-haspopup="dialog"
      title={`Open procedures and tags for tooth ${toothNumber}`}
    >
      {content}
    </button>
  );
}
