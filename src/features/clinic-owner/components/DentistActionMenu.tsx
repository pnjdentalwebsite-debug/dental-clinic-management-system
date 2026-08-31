import { useEffect, useRef, useState } from 'react';
import { Edit3, Eye, FileText, MoreVertical, Power, PowerOff } from 'lucide-react';
import { Portal } from '../../../components/overlays/Portal';

interface Props {
  status?: string;
  onAction: (action: string) => void;
  readOnly?: boolean;
}

export function DentistActionMenu({ status, onAction, readOnly = false }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const toggle = () => setOpen(!open);

  const normalizedStatus = status?.toLowerCase() || 'inactive';
  const isActive = normalizedStatus === 'active';

  const getMenuPosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    const rect = triggerRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 4,
      left: Math.max(10, rect.right - 190 + window.scrollX)
    };
  };

  const pos = getMenuPosition();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Associate dentist actions"
        onClick={toggle}
        style={{
          background: open ? 'rgba(99, 102, 241, 0.08)' : 'none',
          border: open ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
          padding: '6px',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px'
        }}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <Portal>
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              width: '190px',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              padding: '6px 0',
              animation: 'fadeIn 0.15s ease'
            }}
          >
            <button
              type="button"
              onClick={() => {
                onAction('View Associate Dentist');
                setOpen(false);
              }}
              style={{
                padding: '8px 12px',
                fontSize: '0.82rem',
                textAlign: 'left',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Eye size={14} style={{ color: 'var(--primary)' }} />
              View Associate Dentist
            </button>

            <button
              type="button"
              disabled={readOnly}
              title={readOnly ? 'Available in a later lifecycle phase' : undefined}
              onClick={() => {
                onAction('Edit Associate Dentist');
                setOpen(false);
              }}
              style={{
                padding: '8px 12px',
                fontSize: '0.82rem',
                textAlign: 'left',
                border: 'none',
                background: 'none',
                cursor: readOnly ? 'not-allowed' : 'pointer',
                opacity: readOnly ? 0.55 : 1,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Edit3 size={14} style={{ color: '#0284c7' }} />
              Edit Information
            </button>

            {normalizedStatus !== 'draft' && (
              <button
                type="button"
                disabled
                title="Available in a later lifecycle phase"
                onClick={() => {
                  onAction('Save As Draft');
                  setOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  cursor: 'not-allowed',
                  opacity: 0.55,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FileText size={14} style={{ color: '#d97706' }} />
                Save As Draft
              </button>
            )}

            <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

            {!isActive ? (
              <button
                type="button"
                disabled
                title="Available in a later lifecycle phase"
                onClick={() => {
                  onAction('Activate Associate Dentist');
                  setOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  cursor: 'not-allowed',
                  opacity: 0.55,
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Power size={14} />
                Activate Associate
              </button>
            ) : (
              <button
                type="button"
                disabled
                title="Available in a later lifecycle phase"
                onClick={() => {
                  onAction('Set Associate Dentist Inactive');
                  setOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  cursor: 'not-allowed',
                  opacity: 0.55,
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <PowerOff size={14} />
                Deactivate Associate
              </button>
            )}
          </div>
        </Portal>
      )}
    </>
  );
}
