import { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Armchair,
  Stethoscope,
  FileText,
  Users,
  Wallet,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Sliders,
  ExternalLink,
  X
} from 'lucide-react';
import {
  branchSettingsStore,
  type BranchSettings,
  type DentalChair,
  type DaySchedule,
  BRANCH_SETTINGS_UPDATED_EVENT
} from '../services/branchSettingsStore';
import { PDFDesignerPage } from '../../pdf-designer/PDFDesignerPage';

interface Props {
  currentClinic: any;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

type TabKey = 'profile' | 'schedule' | 'chairs' | 'clinical' | 'prescription' | 'waitlist' | 'pos';

export function SettingsWorkspacePage({ currentClinic, showToast }: Props) {
  const clinicId = currentClinic?.id || 'CLN-000013';
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [settings, setSettings] = useState<BranchSettings>(branchSettingsStore.getSettings(clinicId));
  const [isDirty, setIsDirty] = useState(false);
  const [chairModalOpen, setChairModalOpen] = useState(false);
  const [pdfDesignerModalOpen, setPdfDesignerModalOpen] = useState(false);

  // New Chair form state
  const [newChairName, setNewChairName] = useState('');
  const [newChairRoom, setNewChairRoom] = useState('');
  const [newChairColor, setNewChairColor] = useState('#3b82f6');

  useEffect(() => {
    setSettings(branchSettingsStore.getSettings(clinicId));
    setIsDirty(false);
  }, [clinicId]);

  useEffect(() => {
    const handleSync = () => {
      setSettings(branchSettingsStore.getSettings(clinicId));
      setIsDirty(false);
    };
    window.addEventListener(BRANCH_SETTINGS_UPDATED_EVENT, handleSync);
    return () => window.removeEventListener(BRANCH_SETTINGS_UPDATED_EVENT, handleSync);
  }, [clinicId]);

  const handleSave = () => {
    branchSettingsStore.updateSettings(clinicId, settings);
    setIsDirty(false);
    showToast('Branch operational settings saved & synchronized in real-time!', 'success');
  };

  const handleReset = () => {
    const fresh = branchSettingsStore.resetSettings(clinicId);
    setSettings(fresh);
    setIsDirty(false);
    showToast('Branch settings restored to clinic defaults.', 'info');
  };

  // Profile updaters
  const updateProfile = (field: keyof BranchSettings['profile'], value: string) => {
    setSettings((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
    setIsDirty(true);
  };

  // Schedule updaters
  const updateDaySchedule = (day: string, updates: Partial<DaySchedule>) => {
    setSettings((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        businessHours: {
          ...prev.schedule.businessHours,
          [day]: { ...prev.schedule.businessHours[day], ...updates }
        }
      }
    }));
    setIsDirty(true);
  };

  // Chair management
  const handleAddChair = () => {
    if (!newChairName.trim()) {
      showToast('Please enter an operatory chair name.', 'warning');
      return;
    }
    const newChair: DentalChair = {
      id: `CH-${Date.now().toString().slice(-4)}`,
      name: newChairName.trim(),
      room: newChairRoom.trim() || 'Main Room',
      color: newChairColor,
      active: true,
      isDefault: settings.chairs.length === 0
    };
    setSettings((prev) => ({
      ...prev,
      chairs: [...prev.chairs, newChair]
    }));
    setIsDirty(true);
    setChairModalOpen(false);
    setNewChairName('');
    setNewChairRoom('');
    showToast(`Added ${newChair.name} to branch operatories.`, 'success');
  };

  const handleDeleteChair = (chairId: string) => {
    if (settings.chairs.length <= 1) {
      showToast('At least one dental chair operatory is required.', 'warning');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      chairs: prev.chairs.filter((c) => c.id !== chairId)
    }));
    setIsDirty(true);
    showToast('Chair operatory removed.', 'info');
  };

  const handleToggleChairActive = (chairId: string) => {
    setSettings((prev) => ({
      ...prev,
      chairs: prev.chairs.map((c) => (c.id === chairId ? { ...c, active: !c.active } : c))
    }));
    setIsDirty(true);
  };

  // Clinical updaters
  const updateClinical = (field: keyof BranchSettings['clinicalDefaults'], value: any) => {
    setSettings((prev) => ({
      ...prev,
      clinicalDefaults: { ...prev.clinicalDefaults, [field]: value }
    }));
    setIsDirty(true);
  };

  // Prescription updaters
  const updateRx = (field: keyof BranchSettings['prescription'], value: any) => {
    setSettings((prev) => ({
      ...prev,
      prescription: { ...prev.prescription, [field]: value }
    }));
    setIsDirty(true);
  };

  // Waitlist updaters
  const updateWaitlist = (field: keyof BranchSettings['waitlist'], value: any) => {
    setSettings((prev) => ({
      ...prev,
      waitlist: { ...prev.waitlist, [field]: value }
    }));
    setIsDirty(true);
  };

  // POS updaters
  const updatePosFloat = (val: number) => {
    setSettings((prev) => ({
      ...prev,
      pos: { ...prev.pos, startingCashFloat: val }
    }));
    setIsDirty(true);
  };

  const updatePaymentMethod = (method: keyof BranchSettings['pos']['acceptedPaymentMethods'], val: boolean) => {
    setSettings((prev) => ({
      ...prev,
      pos: {
        ...prev.pos,
        acceptedPaymentMethods: {
          ...prev.pos.acceptedPaymentMethods,
          [method]: val
        }
      }
    }));
    setIsDirty(true);
  };

  const navTabs = [
    { key: 'profile' as TabKey, label: 'Branch Profile & Address', icon: MapPin, desc: 'Contact numbers, street address & city' },
    { key: 'schedule' as TabKey, label: 'Weekly Operating Schedule', icon: Clock, desc: 'Monday–Sunday clinic hours & lunch breaks' },
    { key: 'chairs' as TabKey, label: 'Operating Dental Chairs', icon: Armchair, desc: 'Operating dental chairs & scheduling color tags' },
    { key: 'clinical' as TabKey, label: 'Clinical Charting & Odontogram', icon: Stethoscope, desc: 'FDI vs Universal tooth notation & defaults' },
    { key: 'prescription' as TabKey, label: 'Rx Pad & Print Layout', icon: FileText, desc: 'PRC/PTR print toggles & prescription footers' },
    { key: 'waitlist' as TabKey, label: 'Daily Waitlist & Queueing', icon: Users, desc: 'Walk-in prefixes, capacity & auto-reset' },
    { key: 'pos' as TabKey, label: 'Cash Drawer & POS Settings', icon: Wallet, desc: 'Starting cash float & accepted payments' }
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const colorPresets = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Banner Header */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '1.25rem 1.75rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px solid var(--border)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Sliders size={20} style={{ color: 'var(--primary)' }} />
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Branch Operational Settings
            </h1>
            {isDirty && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(217, 119, 6, 0.12)',
                  color: '#d97706',
                  border: '1px solid rgba(217, 119, 6, 0.25)'
                }}
              >
                Unsaved Changes
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.84rem' }}>
            Configuration for <strong>{currentClinic?.name || 'Angelo Dental Clinic - Main'}</strong> • Real-time live sync across daily drawer, calendar, and charting.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleReset}
            style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!isDirty}
            style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <Save size={14} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Settings Body Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Vertical Nav Tabs */}
        <div
          className="dashboard-panel"
          style={{
            margin: 0,
            padding: '0.75rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                  backgroundColor: isSelected ? 'var(--secondary-light)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                <div style={{ display: 'grid' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {tab.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {tab.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Active Tab Content Card */}
        <div
          className="dashboard-panel"
          style={{
            margin: 0,
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            minHeight: '520px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* TAB 1: BRANCH PROFILE & ADDRESS */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Branch Profile & Physical Address
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Local clinic facility branding, direct contact hotlines, and location details.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Branch Facility Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.profile.branchName}
                    onChange={(e) => updateProfile('branchName', e.target.value)}
                    placeholder="e.g. Angelo Dental Clinic - Main"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Direct Mobile Hotline</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.profile.contactNumber}
                    onChange={(e) => updateProfile('contactNumber', e.target.value)}
                    placeholder="+63 917 123 4567"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Landline / Front Desk Tel</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.profile.landlineNumber}
                    onChange={(e) => updateProfile('landlineNumber', e.target.value)}
                    placeholder="(046) 417 8900"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Branch Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={settings.profile.branchEmail}
                    onChange={(e) => updateProfile('branchEmail', e.target.value)}
                    placeholder="bacoor@angelodental.com"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Street Address / Building / Unit</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.profile.addressLine1}
                    onChange={(e) => updateProfile('addressLine1', e.target.value)}
                    placeholder="Unit 204, MedTower Building, Aguinaldo Highway"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Barangay / District</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.profile.barangay}
                    onChange={(e) => updateProfile('barangay', e.target.value)}
                    placeholder="Panapaan IV"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>City / Municipality</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.profile.city}
                    onChange={(e) => updateProfile('city', e.target.value)}
                    placeholder="Bacoor"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Province</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.profile.province}
                    onChange={(e) => updateProfile('province', e.target.value)}
                    placeholder="Cavite"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Postal / ZIP Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.profile.postalCode}
                    onChange={(e) => updateProfile('postalCode', e.target.value)}
                    placeholder="4102"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEEKLY OPERATING SCHEDULE */}
          {activeTab === 'schedule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Weekly Operating Schedule & Clinic Hours
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Define active clinic days, daily opening/closing times, and scheduled staff lunch breaks for calendar bookings.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {daysOfWeek.map((day) => {
                  const schedule = settings.schedule.businessHours[day] || {
                    enabled: day !== 'Sunday',
                    openingTime: '08:00',
                    closingTime: '17:00',
                    breakEnabled: true,
                    breakStart: '12:00',
                    breakEnd: '13:00'
                  };

                  return (
                    <div
                      key={day}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: schedule.enabled ? 'var(--card-bg)' : 'var(--background)',
                        opacity: schedule.enabled ? 1 : 0.65,
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ width: '130px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={(e) => updateDaySchedule(day, { enabled: e.target.checked })}
                          style={{ width: 16, height: 16 }}
                        />
                        <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{day}</strong>
                      </div>

                      {schedule.enabled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Hours:</span>
                            <input
                              type="time"
                              className="form-input"
                              value={schedule.openingTime}
                              onChange={(e) => updateDaySchedule(day, { openingTime: e.target.value })}
                              style={{ width: '105px', padding: '0.25rem 0.4rem', fontSize: '0.78rem' }}
                            />
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>to</span>
                            <input
                              type="time"
                              className="form-input"
                              value={schedule.closingTime}
                              onChange={(e) => updateDaySchedule(day, { closingTime: e.target.value })}
                              style={{ width: '105px', padding: '0.25rem 0.4rem', fontSize: '0.78rem' }}
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={schedule.breakEnabled}
                                onChange={(e) => updateDaySchedule(day, { breakEnabled: e.target.checked })}
                              />
                              Lunch Break:
                            </label>
                            {schedule.breakEnabled && (
                              <>
                                <input
                                  type="time"
                                  className="form-input"
                                  value={schedule.breakStart}
                                  onChange={(e) => updateDaySchedule(day, { breakStart: e.target.value })}
                                  style={{ width: '95px', padding: '0.25rem 0.4rem', fontSize: '0.78rem' }}
                                />
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>-</span>
                                <input
                                  type="time"
                                  className="form-input"
                                  value={schedule.breakEnd}
                                  onChange={(e) => updateDaySchedule(day, { breakEnd: e.target.value })}
                                  style={{ width: '95px', padding: '0.25rem 0.4rem', fontSize: '0.78rem' }}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Clinic Closed
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DENTAL CHAIRS & OPERATORIES */}
          {activeTab === 'chairs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Operating Dental Chairs & Rooms
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Manage dental chairs and calendar color tags.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setChairModalOpen(true)}
                  style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                >
                  <Plus size={14} />
                  Add Dental Chair
                </button>
              </div>

              <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', minHeight: '220px' }}>
                <table className="data-table" style={{ margin: 0, fontSize: '0.82rem', width: '100%' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--background)' }}>
                      <th style={{ padding: '0.75rem 0.85rem' }}>Color Tag</th>
                      <th style={{ padding: '0.75rem 0.85rem' }}>Chair Name</th>
                      <th style={{ padding: '0.75rem 0.85rem' }}>Room / Suite</th>
                      <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Active Status</th>
                      <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.chairs.map((chair) => (
                      <tr key={chair.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: chair.color, border: '1px solid rgba(0,0,0,0.1)' }} />
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{chair.color}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{chair.name}</strong>
                          {chair.isDefault && (
                            <span style={{ marginLeft: '0.4rem', fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '999px', backgroundColor: 'rgba(79, 123, 245, 0.1)', color: 'var(--primary)' }}>
                              Default
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)' }}>{chair.room}</td>
                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleChairActive(chair.id)}
                            style={{
                              padding: '0.15rem 0.55rem',
                              borderRadius: '999px',
                              border: 'none',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              backgroundColor: chair.active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: chair.active ? '#10b981' : '#ef4444'
                            }}
                          >
                            {chair.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => handleDeleteChair(chair.id)}
                            style={{ width: 'auto', padding: '0.25rem 0.45rem', fontSize: '0.72rem', color: '#ef4444' }}
                            title="Remove operatory"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CLINICAL CHARTING & ODONTOGRAM */}
          {activeTab === 'clinical' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Clinical Charting & Odontogram Defaults
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Configure dental notation systems, adult/pediatric starting views, and charting behavior.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Tooth Numbering System</label>
                  <select
                    className="form-input"
                    value={settings.clinicalDefaults.toothNumberingSystem}
                    onChange={(e) => updateClinical('toothNumberingSystem', e.target.value as 'FDI' | 'Universal' | 'Palmer')}
                  >
                    <option value="FDI">FDI Two-Digit ISO-3950 (11–48) — Philippine Standard</option>
                    <option value="Universal">Universal (ADA) Numbering System (1–32 / A–T)</option>
                    <option value="Palmer">Palmer Notation System (1–8 / A–E with Quadrant Symbols)</option>
                  </select>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Applied across patient dental charts, odontogram tags, and lab order dispatches.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Default Starting Chart View</label>
                  <select
                    className="form-input"
                    value={settings.clinicalDefaults.defaultChartView}
                    onChange={(e) => updateClinical('defaultChartView', e.target.value as any)}
                  >
                    <option value="adult">Adult Permanent Dentition (32 Teeth)</option>
                    <option value="pediatric">Pediatric Deciduous Dentition (20 Primary Teeth)</option>
                  </select>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.clinicalDefaults.quickTaggingMode}
                      onChange={(e) => updateClinical('quickTaggingMode', e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }}>
                        Quick-Tagging Odontogram Mode
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Apply selected tooth conditions on click without triggering extra confirmation modals.
                      </span>
                    </div>
                  </label>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.clinicalDefaults.showClinicalAlertBanner}
                      onChange={(e) => updateClinical('showClinicalAlertBanner', e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }}>
                        Medical Allergy & Warning Banners
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Display red warning banners for hypertension, allergies, and bleeding disorders.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RX PAD & PRINT LAYOUT */}
          {activeTab === 'prescription' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Prescription (Rx) Pad & Print Configuration
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Doctor license credentials, custom prescription disclaimers, and print template design.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setPdfDesignerModalOpen(true)}
                  style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                >
                  <ExternalLink size={14} />
                  Open PDF Designer
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Doctor Specialty Header</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.prescription.doctorHeaderTitle}
                    onChange={(e) => updateRx('doctorHeaderTitle', e.target.value)}
                    placeholder="Dental Medicine & Orthodontics"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.prescription.autoPrintPrcNo}
                      onChange={(e) => updateRx('autoPrintPrcNo', e.target.checked)}
                    />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      Auto-print Doctor PRC License Number on Rx
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.prescription.autoPrintPtrNo}
                      onChange={(e) => updateRx('autoPrintPtrNo', e.target.checked)}
                    />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      Auto-print Doctor PTR Official Tax Receipt Number
                    </span>
                  </label>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Default Prescription Disclaimer / Footer Notes</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    style={{ width: '100%', resize: 'none' }}
                    value={settings.prescription.defaultDisclaimer}
                    onChange={(e) => updateRx('defaultDisclaimer', e.target.value)}
                    placeholder="Enter standard disclaimer text printed at the bottom of patient prescriptions..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WAITLIST & QUEUEING */}
          {activeTab === 'waitlist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Daily Walk-in Waitlist & Queueing Rules
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Queue prefixes, maximum daily walk-in capacities, and auto-archiving schedules.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Queue Number Prefix</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.waitlist.queuePrefix}
                    onChange={(e) => updateWaitlist('queuePrefix', e.target.value)}
                    placeholder="WK-"
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Prefix added to walk-in queue tickets (e.g. WK-01, WK-02).
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Max Daily Walk-in Capacity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.waitlist.maxDailyCapacity}
                    onChange={(e) => updateWaitlist('maxDailyCapacity', Number(e.target.value))}
                    placeholder="25"
                  />
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.waitlist.autoResetEndOfDay}
                      onChange={(e) => updateWaitlist('autoResetEndOfDay', e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }}>
                        Auto-Reset Waitlist at End-of-Day
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Automatically archive and clear pending walk-ins at midnight to start fresh every morning.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CASH DRAWER & POS */}
          {activeTab === 'pos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Cash Drawer & Point-of-Sale (POS) Configuration
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Opening drawer baseline floats and clinic settlement methods for daily reconciliation.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Default Starting Cash Float (PHP)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.pos.startingCashFloat}
                    onChange={(e) => updatePosFloat(Number(e.target.value))}
                    placeholder="5000"
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Powers the Opening Cash Float in Daily Reports & Cash Drawer Reconciliation in real-time.
                  </span>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                    Accepted Payment Channels
                  </strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={settings.pos.acceptedPaymentMethods.cash} onChange={(e) => updatePaymentMethod('cash', e.target.checked)} />
                      Cash
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={settings.pos.acceptedPaymentMethods.gcash} onChange={(e) => updatePaymentMethod('gcash', e.target.checked)} />
                      GCash
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={settings.pos.acceptedPaymentMethods.maya} onChange={(e) => updatePaymentMethod('maya', e.target.checked)} />
                      Maya
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={settings.pos.acceptedPaymentMethods.card} onChange={(e) => updatePaymentMethod('card', e.target.checked)} />
                      Credit / Debit Card
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={settings.pos.acceptedPaymentMethods.hmo} onChange={(e) => updatePaymentMethod('hmo', e.target.checked)} />
                      HMO Insurance
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={settings.pos.acceptedPaymentMethods.bankTransfer} onChange={(e) => updatePaymentMethod('bankTransfer', e.target.checked)} />
                      Bank Transfer
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Card Footer */}
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Last synchronized: {new Date(settings.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!isDirty}
                style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
              >
                <Save size={13} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ADD CHAIR MODAL (High z-index) */}
      {chairModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setChairModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              width: '100%',
              maxWidth: '480px',
              padding: '1.5rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Add Operatory Dental Chair
              </h3>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setChairModalOpen(false)}
                style={{ padding: '0.3rem', width: 'auto', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Dental Chair Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newChairName}
                  onChange={(e) => setNewChairName(e.target.value)}
                  placeholder="e.g. Chair 4 - Main Room"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Room / Suite</label>
                <input
                  type="text"
                  className="form-input"
                  value={newChairRoom}
                  onChange={(e) => setNewChairRoom(e.target.value)}
                  placeholder="Room 104"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Calendar Color Tag</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {colorPresets.map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setNewChairColor(clr)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: clr,
                        border: newChairColor === clr ? '3px solid var(--text-primary)' : '2px solid white',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setChairModalOpen(false)} style={{ width: 'auto' }}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAddChair} style={{ width: 'auto' }}>
                Save Dental Chair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF DESIGNER MODAL (High z-index) */}
      {pdfDesignerModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem'
          }}
          onClick={() => setPdfDesignerModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Interactive PDF & Prescription Layout Designer
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Preview and customize templates for {currentClinic?.name || 'Angelo Dental Clinic - Main'}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPdfDesignerModalOpen(false)}
                style={{ padding: '0.35rem 0.75rem', width: 'auto', fontSize: '0.8rem' }}
              >
                Close Designer
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <PDFDesignerPage currentClinic={currentClinic} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
