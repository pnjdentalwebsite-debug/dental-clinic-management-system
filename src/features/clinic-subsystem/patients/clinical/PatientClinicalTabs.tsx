import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { PatientClinicalTab, PatientClinicalTabId } from './patientClinicalTypes';

interface Props {
  tabs: PatientClinicalTab[];
  activeTab: PatientClinicalTabId;
  onTabChange: (tabId: PatientClinicalTabId) => void;
}

export function PatientClinicalTabs({ tabs, activeTab, onTabChange }: Props) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement | null>(null);

  const { primaryTabs, overflowTabs } = useMemo(() => ({
    primaryTabs: tabs.slice(0, 8),
    overflowTabs: tabs.slice(8)
  }), [tabs]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!overflowRef.current?.contains(event.target as Node)) {
        setOverflowOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const isOverflowActive = overflowTabs.some((tab) => tab.id === activeTab);

  return (
    <div className="patient-clinical-tabs" role="tablist" aria-label="Patient clinical workspace">
      {primaryTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`patient-clinical-tabs__button ${isActive ? 'is-active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.status === 'future' && <small>Future</small>}
          </button>
        );
      })}

      {overflowTabs.length > 0 && (
        <div className="patient-clinical-tabs__overflow" ref={overflowRef}>
          <button
            type="button"
            className={`patient-clinical-tabs__button patient-clinical-tabs__overflow-trigger ${isOverflowActive || overflowOpen ? 'is-active' : ''}`}
            aria-haspopup="menu"
            aria-expanded={overflowOpen}
            onClick={() => setOverflowOpen((current) => !current)}
          >
            <MoreHorizontal size={16} />
          </button>

          {overflowOpen && (
            <div className="patient-clinical-tabs__overflow-menu" role="menu" aria-label="More clinical tabs">
              {overflowTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="menuitem"
                    className={`patient-clinical-tabs__overflow-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      onTabChange(tab.id);
                      setOverflowOpen(false);
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.status === 'future' && <small>Future</small>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
