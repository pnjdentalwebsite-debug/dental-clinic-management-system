import { useEffect, useRef, useState } from 'react';
import { Archive, Edit3, Eye, FileText, FlaskConical, MoreVertical, Power, PowerOff } from 'lucide-react';
import { Portal } from '../../../components/overlays/Portal';

interface Props {
  onAction: (action: string) => void;
  status?: string;
}

export function ClinicLaboratoryActionMenu({ onAction, status = 'active' }: Props) {
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
        onClick={toggle}
        aria-label="Laboratory actions"
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
                onAction('view');
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
              View Laboratory Details
            </button>

            <button
              type="button"
              onClick={() => {
                onAction('edit');
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
              <Edit3 size={14} style={{ color: '#0284c7' }} />
              Edit Information
            </button>

            <button
              type="button"
              onClick={() => {
                onAction('services');
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
              <FlaskConical size={14} style={{ color: '#8b5cf6' }} />
              Manage Services
            </button>

            {normalizedStatus !== 'draft' && (
              <button
                type="button"
                onClick={() => {
                  onAction('draft');
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
                <FileText size={14} style={{ color: '#d97706' }} />
                Save As Draft
              </button>
            )}

            <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

            {!isActive ? (
              <button
                type="button"
                onClick={() => {
                  onAction('activate');
                  setOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Power size={14} />
                Activate Laboratory
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onAction('deactivate');
                  setOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <PowerOff size={14} />
                Deactivate Laboratory
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onAction('archive');
                setOpen(false);
              }}
              style={{
                padding: '8px 12px',
                fontSize: '0.82rem',
                textAlign: 'left',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Archive size={14} />
              Archive Record
            </button>
          </div>
        </Portal>
      )}
    </>
  );
}

