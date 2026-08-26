import type { BrandingSettings as BrandingSettingsType } from './templateTypes';

interface Props {
  branding: BrandingSettingsType;
  onChange: <Key extends keyof BrandingSettingsType>(key: Key, value: BrandingSettingsType[Key]) => void;
}

export function BrandingSettings({ branding, onChange }: Props) {
  return (
    <section className="pdf-designer-branding">
      <div className="pdf-designer-branding__header">
        <h3>Branding Settings</h3>
        <p>Customize the clinic identity that appears in document previews.</p>
      </div>
      <div className="pdf-designer-branding__grid">
        <label><span>Clinic Name</span><input value={branding.clinicName} onChange={(event) => onChange('clinicName', event.target.value)} /></label>
        <label><span>Clinic Address</span><input value={branding.clinicAddress} onChange={(event) => onChange('clinicAddress', event.target.value)} /></label>
        <label><span>Contact Number</span><input value={branding.contactNumber} onChange={(event) => onChange('contactNumber', event.target.value)} /></label>
        <label><span>Logo Placeholder</span><input value={branding.logo} onChange={(event) => onChange('logo', event.target.value)} /></label>
        <label className="pdf-designer-branding__wide"><span>Footer Text</span><input value={branding.footerText} onChange={(event) => onChange('footerText', event.target.value)} /></label>
      </div>
    </section>
  );
}
