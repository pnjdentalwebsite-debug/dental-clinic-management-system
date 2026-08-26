import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Portal } from './Portal';
import './overlay.css';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  headerContent?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  role?: 'dialog' | 'alertdialog';
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  plainCloseButton?: boolean;
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function Modal({
  open,
  title,
  description,
  headerContent,
  children,
  footer,
  onClose,
  closeOnBackdrop = true,
  closeOnEscape = true,
  role = 'dialog',
  width = 'md',
  plainCloseButton = false
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-title`;
  const descriptionId = description ? `${titleId}-description` : undefined;

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(focusableSelector);
      (focusable || panelRef.current)?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeOnEscape, onClose, open]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="overlay-backdrop"
        onMouseDown={(event) => {
          if (closeOnBackdrop && event.target === event.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          className={`overlay-modal overlay-modal-${width}`}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <div className="overlay-modal-header">
            <div>
              <h2 id={titleId}>{title}</h2>
              {description && <p id={descriptionId}>{description}</p>}
            </div>
            <button className={`overlay-icon-button ${plainCloseButton ? 'overlay-icon-button--plain' : ''}`.trim()} type="button" aria-label="Close dialog" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          {headerContent ? <div className="overlay-modal-header-content">{headerContent}</div> : null}
          <div className="overlay-modal-body">{children}</div>
          {footer && <div className="overlay-modal-footer">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}
