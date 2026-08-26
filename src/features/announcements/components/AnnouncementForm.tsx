import { useMemo, useState } from 'react';
import { 
  Eye, 
  Save, 
  Send, 
  CalendarClock, 
  Sparkles, 
  Wrench, 
  CreditCard, 
  Calendar, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  Bell, 
  Smartphone, 
  Layout, 
  Tag
} from 'lucide-react';
import { Modal } from '../../../components/overlays/Modal';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockLaboratoryService } from '../../laboratories/services/mockLaboratoryService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockAnnouncementService } from '../services/mockAnnouncementService';
import type { Announcement, AnnouncementAudience, AnnouncementFormData, DeliveryChannel } from '../types';

interface Props {
  initial?: Announcement | null;
  onCancel: () => void;
  onSave: (data: AnnouncementFormData, mode: 'draft' | 'publish' | 'schedule') => void;
}

const channelLabels: Record<DeliveryChannel, { label: string; desc: string; icon: typeof Bell }> = {
  in_app: { label: 'In-App System Notification', desc: 'Alert banner & Notification center tray across all logged-in platform screens.', icon: Bell },
  push_placeholder: { label: 'Mobile Push Notification (Mock)', desc: 'Instant mobile device push alert for attending dentists and staff.', icon: Smartphone },
  email_placeholder: { label: 'Email Digest Broadcast (Mock)', desc: 'Official registered subscriber email notification template.', icon: Send },
  sms_placeholder: { label: 'SMS Priority Dispatch (Mock)', desc: 'Critical SMS dispatch to verified clinic owner mobile numbers.', icon: Smartphone }
};

const channels = Object.keys(channelLabels) as DeliveryChannel[];
const labels = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

// PRESET TEMPLATES
const PRESET_TEMPLATES = [
  {
    id: 'maintenance',
    title: 'Scheduled System Upgrade & Server Maintenance',
    icon: Wrench,
    color: '#ea580c',
    badge: 'Maintenance',
    summary: 'The Dental Platform will undergo scheduled infrastructure maintenance on Saturday from 11:00 PM to 3:00 AM PHT.',
    content: `Dear Dental Clinic Partners & Staff,\n\nPlease be advised that our engineering team will be performing scheduled cloud infrastructure upgrades and database optimization.\n\n📅 Maintenance Window: Saturday, 11:00 PM – 3:00 AM PHT\n⚡ Expected Impact: Intermittent access to patient charts and cloud billing during this 4-hour window.\n\nAll patient clinical data and billing ledgers will be securely backed up before maintenance begins. We apologize for any temporary inconvenience.`,
    announcementType: 'maintenance' as const,
    priority: 'high' as const,
    featured: true,
    requiresAcknowledgement: false,
    tags: ['maintenance', 'infrastructure', 'cloud-upgrade', 'advisory']
  },
  {
    id: 'feature',
    title: 'New Feature Release: Dental Charting Multi-Notation & Operatory Sync',
    icon: Sparkles,
    color: '#8b5cf6',
    badge: 'Feature Update',
    summary: 'Introducing seamless switching between FDI, Universal ADA, and Palmer Notation, plus real-time operatory chair syncing!',
    content: `Exciting New Upgrades are now live in your Clinic Subsystem!\n\n✨ Dental Charting Triple Notation:\n- Instantly switch between FDI Two-Digit (ISO-3950), Universal ADA (1–32), and Palmer Quadrant Notations.\n- All notations automatically synchronize with Patient History, Printable Charts, and PDF exports.\n\n💺 Real-time Operating Rooms & Chairs:\n- Active operatory chairs configured in Branch Settings now sync live with your Clinic Dashboard.\n\nExplore these features in your clinical workspace today!`,
    announcementType: 'feature_release' as const,
    priority: 'normal' as const,
    featured: true,
    requiresAcknowledgement: false,
    tags: ['features', 'dental-charting', 'odontogram', 'release-notes']
  },
  {
    id: 'billing',
    title: 'Upcoming Subscription Renewal & Plan Quota Reminder',
    icon: CreditCard,
    color: '#2563eb',
    badge: 'Billing Notice',
    summary: 'Monthly SaaS subscription renewal advisory and branch/dentist quota utilization overview.',
    content: `Dear Clinic Subscriber,\n\nThis is a friendly reminder regarding your upcoming monthly platform subscription cycle.\n\n💳 Active Plan: Enterprise Max Plan (Unlimited Branch & Clinician Capacity)\n🧾 Remittance Channels: GCash, Maya, and BDO/BPI Bank Transfer are verified and active.\n\nYou can view and download your official VAT invoices anytime under Clinic Console > Subscription & Quotas Settings.`,
    announcementType: 'subscription' as const,
    priority: 'normal' as const,
    featured: false,
    requiresAcknowledgement: false,
    tags: ['billing', 'subscription', 'invoice', 'quotas']
  },
  {
    id: 'emergency',
    title: 'URGENT: Cloud Infrastructure Latency & Security Advisory',
    icon: ShieldAlert,
    color: '#dc2626',
    badge: 'Emergency Alert',
    summary: 'Mandatory acknowledgement notice regarding third-party payment gateway latency.',
    content: `CRITICAL SYSTEM NOTICE:\n\nWe have identified intermittent latency with GCash and Maya digital webhook settlements. While payments are clearing successfully, automated receipt reconciliation may experience a 5–10 minute delay.\n\n⚠️ Action Required: Attending clinic cashiers may verify pending transactions via the Reference Number ledger in Bills & Payments.\n\nPlease click "Acknowledge" below to confirm receipt of this advisory.`,
    announcementType: 'emergency' as const,
    priority: 'urgent' as const,
    featured: true,
    requiresAcknowledgement: true,
    tags: ['emergency', 'urgent', 'gateway', 'security']
  },
  {
    id: 'holiday',
    title: 'National Holiday Advisory: Support Desk & Partner Lab Schedule',
    icon: Calendar,
    color: '#059669',
    badge: 'Holiday Advisory',
    summary: 'Customer support operations and WeSmile Partner Lab turnaround schedule during the upcoming holiday.',
    content: `Advisory to all Partner Clinics and Laboratories:\n\nIn observance of the upcoming National Holiday, please take note of our adjusted operational schedules:\n\n🏢 Platform Technical Support: Available 24/7 for critical emergencies.\n🔬 WeSmile Partner Dental Laboratory: Work orders submitted after 12:00 PM will resume processing on the next regular business day.\n\nThank you for your continued partnership!`,
    announcementType: 'general' as const,
    priority: 'normal' as const,
    featured: false,
    requiresAcknowledgement: false,
    tags: ['holiday', 'advisory', 'laboratory', 'schedule']
  }
];

export function AnnouncementForm({ initial, onCancel, onSave }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'banner' | 'toast' | 'mobile'>('banner');
  const [data, setData] = useState<AnnouncementFormData>(() => initial ? {
    title: initial.title,
    slug: initial.slug,
    summary: initial.summary,
    content: initial.content,
    announcementType: initial.announcementType,
    priority: initial.priority,
    visibility: initial.visibility,
    targetAudience: initial.targetAudience,
    deliveryChannels: initial.deliveryChannels,
    publishAt: initial.publishAt || '',
    expiresAt: initial.expiresAt || '',
    featured: initial.featured,
    requiresAcknowledgement: initial.requiresAcknowledgement,
    allowDismiss: initial.allowDismiss,
    tags: initial.tags,
    internalNotes: initial.internalNotes || ''
  } : mockAnnouncementService.getDefaultFormData());

  const subscribers = mockPlatformManagementService.listSubscribers();
  const users = mockPlatformManagementService.listUsers();
  const plans = mockPlanService.listPlans();
  const clinics = mockClinicService.listClinics();
  const labs = mockLaboratoryService.listLaboratories();

  const estimate = useMemo(() => mockAnnouncementService.estimateAudience(data.targetAudience), [data.targetAudience]);
  const preview = mockAnnouncementService.previewAnnouncement(data);

  const update = <K extends keyof AnnouncementFormData>(key: K, value: AnnouncementFormData[K]) => setData(prev => ({ ...prev, [key]: value }));
  const updateAudience = <K extends keyof AnnouncementAudience>(key: K, value: AnnouncementAudience[K]) => update('targetAudience', { ...data.targetAudience, [key]: value });
  const toggle = <T extends string>(values: T[], value: T) => values.includes(value) ? values.filter(item => item !== value) : [...values, value];
  const submit = (mode: 'draft' | 'publish' | 'schedule') => onSave(data, mode);

  const applyTemplate = (tmpl: typeof PRESET_TEMPLATES[0]) => {
    setData(prev => ({
      ...prev,
      title: tmpl.title,
      summary: tmpl.summary,
      content: tmpl.content,
      announcementType: tmpl.announcementType,
      priority: tmpl.priority,
      featured: tmpl.featured,
      requiresAcknowledgement: tmpl.requiresAcknowledgement,
      tags: tmpl.tags
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      {/* 1-CLICK BROADCAST PRESET TEMPLATES */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={16} color="#8b5cf6" />
            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>1-Click Quick Broadcast Templates</strong>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>— Pre-populate message details and formatting</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {PRESET_TEMPLATES.map(tmpl => {
            const Icon = tmpl.icon;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => applyTemplate(tmpl)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tmpl.color,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  flexShrink: 0
                }}>
                  <Icon size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{tmpl.badge}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem', lineHeight: 1.3 }}>
                    {tmpl.title.length > 40 ? `${tmpl.title.substring(0, 40)}...` : tmpl.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FORM GRID: 2 COLUMNS (LEFT: CONTENT & BEHAVIOR, RIGHT: AUDIENCE & CHANNELS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        {/* LEFT COLUMN: MESSAGE CONTENT & METADATA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Card 1: Content */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Layout size={16} color="#2563eb" /> Broadcast Content & Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Announcement Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Scheduled System Upgrade & Server Maintenance"
                  value={data.title}
                  onChange={e => {
                    const val = e.target.value;
                    setData(prev => ({
                      ...prev,
                      title: val,
                      slug: prev.slug ? prev.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    }));
                  }}
                  style={{ width: '100%', height: '40px', borderRadius: '10px', fontSize: '0.875rem' }}
                />
              </div>

              {/* Slug & Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>URL Slug</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="system-maintenance-advisory"
                    value={data.slug}
                    onChange={e => update('slug', e.target.value)}
                    style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Category Type</label>
                  <select
                    className="form-input"
                    value={data.announcementType}
                    onChange={e => update('announcementType', e.target.value as AnnouncementFormData['announcementType'])}
                    style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '0.8rem' }}
                  >
                    {['general', 'maintenance', 'service_update', 'subscription', 'payment', 'security', 'policy', 'emergency', 'feature_release', 'other'].map(item => (
                      <option key={item} value={item}>{labels(item)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority Segmented Pill Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Priority Level</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {(['low', 'normal', 'high', 'urgent'] as const).map(p => {
                    const isSelected = data.priority === p;
                    const colorMap = {
                      urgent: { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' },
                      high: { bg: '#fff7ed', border: '#f97316', text: '#ea580c' },
                      normal: { bg: '#eff6ff', border: '#3b82f6', text: '#2563eb' },
                      low: { bg: '#f8fafc', border: '#94a3b8', text: '#64748b' }
                    };
                    const theme = colorMap[p];

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => update('priority', p)}
                        style={{
                          padding: '0.5rem 0.25rem',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${theme.border}` : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? theme.bg : '#ffffff',
                          color: isSelected ? theme.text : '#64748b',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Summary Teaser (Shows on notification cards) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Brief summary of the broadcast message..."
                  value={data.summary}
                  onChange={e => update('summary', e.target.value)}
                  style={{ width: '100%', borderRadius: '8px', fontSize: '0.825rem' }}
                />
              </div>

              {/* Full Content */}
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Full Announcement Content Body <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows={8}
                  placeholder="Write the complete announcement text, instructions, and schedule details..."
                  value={data.content}
                  onChange={e => update('content', e.target.value)}
                  style={{ width: '100%', borderRadius: '8px', fontSize: '0.825rem', lineHeight: 1.5 }}
                />
              </div>

              {/* Tags Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  <Tag size={12} style={{ display: 'inline', marginRight: '4px' }} /> Tags (Comma separated)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="maintenance, cloud, release-notes, billing"
                  value={data.tags.join(', ')}
                  onChange={e => update('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '0.8rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AUDIENCE, CHANNELS, SCHEDULE & GOVERNANCE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Card 2: Audience Targeting */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Users size={16} color="#10b981" /> Audience Targeting & Live Inspector
            </h3>

            {/* Audience Mode Selector */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Audience Mode</label>
              <select
                className="form-input"
                value={data.targetAudience.mode}
                onChange={e => updateAudience('mode', e.target.value as AnnouncementAudience['mode'])}
                style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '0.825rem', fontWeight: 600 }}
              >
                <option value="all_platform_users">All Platform Users (Global Broadcast)</option>
                <option value="all_subscribers">All Clinic Owners / Primary Subscribers</option>
                <option value="user_roles">Specific Personnel Roles (Dentists, Staff, Owners)</option>
                <option value="subscription_plan">By Subscription Tier (Max, Plus, Basic)</option>
                <option value="subscription_status">By Subscription Health (Active, Expiring)</option>
                <option value="clinics">Specific Clinic Facilities / Branches</option>
                <option value="laboratories">Partner Dental Laboratories</option>
                <option value="specific_subscribers">Specific Selected Subscribers</option>
                <option value="specific_users">Specific Individual Accounts</option>
              </select>
            </div>

            {/* Audience Detailed Checkbox Grids */}
            {data.targetAudience.mode === 'user_roles' && (
              <Selector
                title="Select Target Personnel Roles"
                values={['clinic_owner', 'associate', 'staff', 'platform_owner']}
                labelFor={r => r === 'clinic_owner' ? 'Clinic Owners' : r === 'associate' ? 'Associate Dentists' : r === 'staff' ? 'Front Desk & Staff' : 'Platform Admins'}
                selected={data.targetAudience.userRoles}
                onToggle={val => updateAudience('userRoles', toggle(data.targetAudience.userRoles, val as never))}
              />
            )}

            {data.targetAudience.mode === 'subscription_plan' && (
              <Selector
                title="Select Target Subscription Tiers"
                values={plans.map(p => p.id)}
                labelFor={id => plans.find(p => p.id === id)?.name || id}
                selected={data.targetAudience.planIds}
                onToggle={val => updateAudience('planIds', toggle(data.targetAudience.planIds, val))}
              />
            )}

            {data.targetAudience.mode === 'clinics' && (
              <Selector
                title="Select Specific Clinic Branches"
                values={clinics.map(c => c.id)}
                labelFor={id => clinics.find(c => c.id === id)?.name || id}
                selected={data.targetAudience.clinicIds}
                onToggle={val => updateAudience('clinicIds', toggle(data.targetAudience.clinicIds, val))}
              />
            )}

            {data.targetAudience.mode === 'laboratories' && (
              <Selector
                title="Select Partner Dental Laboratories"
                values={labs.map(l => l.id)}
                labelFor={id => labs.find(l => l.id === id)?.name || id}
                selected={data.targetAudience.laboratoryIds}
                onToggle={val => updateAudience('laboratoryIds', toggle(data.targetAudience.laboratoryIds, val))}
              />
            )}

            {data.targetAudience.mode === 'specific_subscribers' && (
              <Selector
                title="Select Subscribers"
                values={subscribers.map(s => s.id)}
                labelFor={id => subscribers.find(s => s.id === id)?.businessName || id}
                selected={data.targetAudience.subscriberIds}
                onToggle={val => updateAudience('subscriberIds', toggle(data.targetAudience.subscriberIds, val))}
              />
            )}

            {data.targetAudience.mode === 'specific_users' && (
              <Selector
                title="Select User Accounts"
                values={users.map(u => u.id)}
                labelFor={id => users.find(u => u.id === id)?.fullName || id}
                selected={data.targetAudience.userIds}
                onToggle={val => updateAudience('userIds', toggle(data.targetAudience.userIds, val))}
              />
            )}

            {/* LIVE AUDIENCE INSPECTOR BANNER */}
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Resolved Target Audience</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
                  {estimate.count} Active Recipient{estimate.count === 1 ? '' : 's'}
                </div>
                <div style={{ fontSize: '0.725rem', color: '#065f46', marginTop: '0.15rem' }}>
                  {estimate.label}
                </div>
              </div>
              <div style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #6ee7b7',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <CheckCircle2 size={14} color="#10b981" /> 100% Resolved
              </div>
            </div>
          </div>

          {/* Card 3: Delivery Channels, Governance & Schedule */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Send size={16} color="#8b5cf6" /> Delivery Channels & Scheduling
            </h3>

            {/* Delivery Channels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#334155' }}>Active Delivery Channels</label>
              {channels.map(channel => {
                const isChecked = data.deliveryChannels.includes(channel);
                const info = channelLabels[channel];
                const Icon = info.icon;

                return (
                  <label
                    key={channel}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: isChecked ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                      backgroundColor: isChecked ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => update('deliveryChannels', toggle(data.deliveryChannels, channel))}
                      style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                    />
                    <Icon size={16} color={isChecked ? '#2563eb' : '#64748b'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isChecked ? '#1e293b' : '#64748b' }}>{info.label}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{info.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Governance Switches */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem',
                borderRadius: '8px',
                border: data.featured ? '1px solid #fde68a' : '1px solid #e2e8f0',
                backgroundColor: data.featured ? '#fefce8' : '#f8fafc',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={data.featured}
                  onChange={e => update('featured', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
                />
                <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#1e293b' }}>Pin as Featured</span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem',
                borderRadius: '8px',
                border: data.requiresAcknowledgement ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                backgroundColor: data.requiresAcknowledgement ? '#fef2f2' : '#f8fafc',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={data.requiresAcknowledgement}
                  onChange={e => update('requiresAcknowledgement', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#dc2626' }}
                />
                <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#1e293b' }}>Require Ack</span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={data.allowDismiss}
                  onChange={e => update('allowDismiss', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#1e293b' }}>Allow Dismiss</span>
              </label>
            </div>

            {/* Date Time Pickers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  <CalendarClock size={12} style={{ display: 'inline', marginRight: '4px' }} /> Publish At (Schedule)
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={data.publishAt}
                  onChange={e => update('publishAt', e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Expiration Date
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={data.expiresAt}
                  onChange={e => update('expiresAt', e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '0.8rem' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '1rem 1.25rem',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <button
          type="button"
          className="btn btn-outline"
          style={{ width: 'auto', fontSize: '0.85rem' }}
          onClick={onCancel}
        >
          Discard & Cancel
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: 'auto', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => submit('draft')}
          >
            <Save size={14} /> Save as Draft
          </button>

          <button
            type="button"
            className="btn btn-outline"
            style={{ width: 'auto', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderColor: '#3b82f6', color: '#1d4ed8' }}
            onClick={() => setPreviewOpen(true)}
          >
            <Eye size={14} /> Live Preview
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: 'auto', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => submit('schedule')}
          >
            <CalendarClock size={14} /> Schedule Broadcast
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: 'auto', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => submit('publish')}
          >
            <Send size={14} /> Publish Immediately
          </button>
        </div>
      </div>

      {/* RICH LIVE PREVIEW MODAL */}
      <Modal
        open={previewOpen}
        title="Live Broadcast Preview Simulator"
        description={`Targeting ${preview.recipientEstimate} resolved recipient(s). Preview reflects real-time styling.`}
        onClose={() => setPreviewOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: 'auto' }}
              onClick={() => setPreviewOpen(false)}
            >
              Back to Editing
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => {
                setPreviewOpen(false);
                submit('publish');
              }}
            >
              <Send size={14} /> Publish Broadcast Now
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setPreviewTab('banner')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: previewTab === 'banner' ? '#eff6ff' : 'transparent',
                color: previewTab === 'banner' ? '#1d4ed8' : '#64748b',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Desktop Header Banner
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab('toast')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: previewTab === 'toast' ? '#eff6ff' : 'transparent',
                color: previewTab === 'toast' ? '#1d4ed8' : '#64748b',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Notification Center Card
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab('mobile')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: previewTab === 'mobile' ? '#eff6ff' : 'transparent',
                color: previewTab === 'mobile' ? '#1d4ed8' : '#64748b',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Mobile View Simulation
            </button>
          </div>

          {previewTab === 'banner' && (
            <div style={{
              padding: '1.25rem',
              backgroundColor: data.priority === 'urgent' ? '#fef2f2' : '#eff6ff',
              borderRadius: '12px',
              border: data.priority === 'urgent' ? '1px solid #fca5a5' : '1px solid #bfdbfe',
              color: data.priority === 'urgent' ? '#991b1b' : '#1e40af'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Bell size={18} />
                <strong style={{ fontSize: '0.95rem' }}>{data.title || 'Untitled Announcement'}</strong>
                <span style={{
                  fontSize: '0.675rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  backgroundColor: data.priority === 'urgent' ? '#fee2e2' : '#dbeafe',
                  color: data.priority === 'urgent' ? '#dc2626' : '#1d4ed8',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {data.priority}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {data.content || 'Announcement content text will appear here...'}
              </p>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                Target: {preview.audienceLabel} • Channels: {data.deliveryChannels.map(labels).join(', ')}
              </div>
            </div>
          )}

          {previewTab === 'toast' && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <Bell size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{data.title || 'Untitled Announcement'}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Just now</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  {data.summary || 'Summary teaser will display here...'}
                </p>
                {data.requiresAcknowledgement && (
                  <button type="button" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', width: 'auto' }}>
                    I Acknowledge This Notice
                  </button>
                )}
              </div>
            </div>
          )}

          {previewTab === 'mobile' && (
            <div style={{
              maxWidth: '360px',
              margin: '0 auto',
              backgroundColor: '#f8fafc',
              borderRadius: '16px',
              border: '2px solid #cbd5e1',
              padding: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ textAlign: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                MOBILE APPLICATION NOTIFICATION
              </div>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '0.85rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                  {data.announcementType}
                </span>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0' }}>
                  {data.title || 'Untitled Announcement'}
                </h4>
                <p style={{ fontSize: '0.775rem', color: '#64748b', lineHeight: 1.4, margin: 0 }}>
                  {data.summary || 'Summary teaser for mobile lockscreen...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function Selector({ title, values, selected, onToggle, labelFor = labels }: { title: string; values: string[]; selected: string[]; onToggle: (value: string) => void; labelFor?: (value: string) => string }) {
  if (!values.length) return null;
  return (
    <div style={{
      marginTop: '0.75rem',
      padding: '0.75rem',
      borderRadius: '10px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
        {values.slice(0, 16).map(value => {
          const isChecked = selected.includes(value);
          return (
            <label
              key={value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.775rem',
                color: isChecked ? '#1e293b' : '#64748b',
                fontWeight: isChecked ? 600 : 400,
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(value)}
                style={{ width: '14px', height: '14px', accentColor: '#2563eb' }}
              />
              <span>{labelFor(value)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
