import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, KeyboardEvent } from 'react';
import { MoreVertical } from 'lucide-react';
import { Portal } from './Portal';
import './overlay.css';

export interface RowActionMenuItem {
  id: string;
  label?: string;
  icon?: ComponentType<{ size?: number }>;
  onSelect?: () => void;
  disabled?: boolean;
  hidden?: boolean;
  destructive?: boolean;
  separator?: boolean;
  description?: string;
}

interface RowActionMenuProps {
  ariaLabel: string;
  items: RowActionMenuItem[];
}

interface MenuPosition {
  top?: number | string;
  bottom?: number | string;
  left: number;
  width: number;
}

let openMenuId: string | null = null;
const listeners = new Set<() => void>();

const notifyMenus = () => listeners.forEach(listener => listener());

export function RowActionMenu({ ariaLabel, items }: RowActionMenuProps) {
  const idRef = useRef(`row-menu-${Math.random().toString(36).slice(2)}`);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, bottom: 'auto', left: 0, width: 220 });

  const visibleItems = useMemo(() => items.filter(item => !item.hidden), [items]);
  const focusableItems = visibleItems.filter(item => !item.separator && !item.disabled);

  const closeMenu = (restoreFocus = true) => {
    setOpen(false);
    if (openMenuId === idRef.current) openMenuId = null;
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 220;
    const viewportPadding = 12;

    // Position menu to the LEFT side of the 3-dots button with a 6px gap
    const idealLeft = rect.left - menuWidth - 6;
    const left = Math.max(viewportPadding, idealLeft);

    // Check vertical space: align with top of the 3-dots button, or align with bottom if near the bottom edge
    const spaceBelow = window.innerHeight - rect.top - viewportPadding;
    const openUpwards = spaceBelow < 260 && rect.bottom > 260;

    if (openUpwards) {
      setPosition({
        bottom: Math.max(viewportPadding, window.innerHeight - rect.bottom - 4),
        top: 'auto',
        left,
        width: menuWidth
      });
    } else {
      setPosition({
        top: Math.max(viewportPadding, rect.top - 2),
        bottom: 'auto',
        left,
        width: menuWidth
      });
    }
  }, []);

  const openThisMenu = () => {
    openMenuId = idRef.current;
    notifyMenus();
    updatePosition();
    setOpen(true);
  };

  useEffect(() => {
    const listener = () => {
      if (openMenuId !== idRef.current) setOpen(false);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      closeMenu(false);
    };
    const handleWindowChange = () => closeMenu(false);
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);
    window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLButtonElement>('.row-menu-item:not(:disabled)')?.focus();
    }, 0);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [open, updatePosition]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('.row-menu-item:not(:disabled)') || []);
    const currentIndex = buttons.findIndex(button => button === document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      buttons[(currentIndex + 1 + buttons.length) % buttons.length]?.focus();
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      buttons[(currentIndex - 1 + buttons.length) % buttons.length]?.focus();
    }
    if (event.key === 'Home') {
      event.preventDefault();
      buttons[0]?.focus();
    }
    if (event.key === 'End') {
      event.preventDefault();
      buttons[buttons.length - 1]?.focus();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        className="row-action-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => open ? closeMenu(false) : openThisMenu()}
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <Portal>
          <div
            ref={menuRef}
            className="row-action-menu"
            role="menu"
            aria-label={ariaLabel}
            style={{
              top: position.top,
              bottom: position.bottom,
              left: `${position.left}px`,
              width: `${position.width}px`
            }}
            onKeyDown={handleKeyDown}
          >
            {visibleItems.map((item, index) => {
              if (item.separator) return <div key={`${item.id}-${index}`} className="row-menu-separator" role="separator" />;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`row-menu-item ${item.destructive ? 'destructive' : ''}`}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  title={item.description}
                  onClick={() => {
                    item.onSelect?.();
                    closeMenu();
                  }}
                >
                  {Icon && <Icon size={16} />}
                  <span>{item.label}</span>
                </button>
              );
            })}
            {focusableItems.length === 0 && <div className="row-menu-empty">No available actions</div>}
          </div>
        </Portal>
      )}
    </>
  );
}
