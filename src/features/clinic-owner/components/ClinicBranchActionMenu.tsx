import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRightCircle, Edit3, Eye, FileText, MoreVertical, Power, PowerOff } from 'lucide-react';
import { Portal } from '../../../components/overlays/Portal';

interface Props {
  status?: string;
  onOpen?: () => void;
  onAction: (action: string) => void;
}

export function ClinicBranchActionMenu({ status, onOpen, onAction }: Props) {
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

  const toggle = () => {
    if (!open) onOpen?.();
    setOpen(!open);
  };

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
  const deferredActionStyle: CSSProperties = {
    padding: '8px 12px',
    fontSize: '0.82rem',
    textAlign: 'left',
    border: 'none',
    background: 'none',
    cursor: 'not-allowed',
    color: 'var(--text-muted)',
    opacity: 0.62,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label="Branch actions"
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
            {isActive && (
              <button
                type="button"
                onClick={() => {
                  onAction('Enter Clinic');
                  setOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <ArrowRightCircle size={14} style={{ color: 'var(--primary)' }} />
                Open Branch Workspace
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onAction('View Details');
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
              View Branch Details
            </button>

            <button
              type="button"
              onClick={() => {
                onAction('Edit Branch');
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

            <button type="button" disabled title="Available in a later lifecycle phase" style={deferredActionStyle}>
              <FileText size={14} />
              Save As Draft · Available later
            </button>

            <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

            <button type="button" disabled title="Available in a later lifecycle phase" style={deferredActionStyle}>
              {isActive ? <PowerOff size={14} /> : <Power size={14} />}
              {isActive ? 'Deactivate Branch' : 'Activate Branch'} · Available later
            </button>
          </div>
        </Portal>
      )}
    </>
  );
}
