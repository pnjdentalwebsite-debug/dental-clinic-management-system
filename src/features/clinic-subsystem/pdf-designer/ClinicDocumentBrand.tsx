import type { CSSProperties } from 'react';

export interface ClinicDocumentBrandProps {
  compact?: boolean;
  clinicName?: string;
  address?: string;
  contact?: string;
  showClinicName?: boolean;
  showAddress?: boolean;
  showContact?: boolean;
  showLogo?: boolean;
  showLogoOutline?: boolean;
  logoSize?: number;
  brandSize?: number;
  bottomMargin?: number;
  logoMargins?: { top: number; bottom: number; left: number; right: number };
  brandMargins?: { top: number; bottom: number; left: number; right: number };
}

export function ClinicDocumentBrand({
  compact = false,
  clinicName = 'P & J TANARTE',
  address = '',
  contact = '',
  showClinicName = true,
  showAddress = true,
  showContact = true,
  showLogo = true,
  showLogoOutline = true,
  logoSize = compact ? 48 : 54,
  brandSize = compact ? 44 : 50,
  bottomMargin = 0,
  logoMargins = { top: 0, bottom: 0, left: 0, right: 0 },
  brandMargins = { top: 0, bottom: 0, left: 0, right: 0 }
}: ClinicDocumentBrandProps) {
  const visibleMeta = [
    showAddress && address,
    showContact && contact
  ].filter(Boolean).join(' | ');
  const brandStyle = {
    '--clinic-brand-logo-size': `${Math.max(34, logoSize)}px`,
    '--clinic-brand-title-size': `${Math.max(13, brandSize * 0.34)}px`,
    '--clinic-brand-subtitle-size': `${Math.max(11, brandSize * 0.28)}px`,
    marginBottom: `${Math.max(0, bottomMargin)}px`
  } as CSSProperties;

  return (
    <div
      className={`clinic-document-brand ${compact ? 'is-compact' : ''} ${showLogo ? 'has-logo' : 'no-logo'}`}
      style={brandStyle}
    >
      <div
        className={`clinic-document-brand__mark ${showLogoOutline ? 'has-outline' : ''}`}
        style={{
          margin: `${logoMargins.top}px ${logoMargins.right}px ${logoMargins.bottom}px ${logoMargins.left}px`
        }}
      >
        {showLogo && (
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="29" />
            <path d="M21 16c5 2 9 2 14 0 7-3 13 2 11 10-2 8-6 17-10 24-2 3-5 2-5-2V32c0-3-2-5-5-5s-5 2-5 5v11c0 4-4 5-6 2-3-6-6-13-7-20-1-7 6-12 13-9Z" />
            <path d="M21 17c7 6 14 6 24 0" />
          </svg>
        )}
      </div>
      <div
        className="clinic-document-brand__wordmark"
        style={{
          margin: `${brandMargins.top}px ${brandMargins.right}px ${brandMargins.bottom}px ${brandMargins.left}px`
        }}
      >
        {showClinicName && (
          <>
            <strong>{clinicName}</strong>
            <span>DENTAL CLINIC</span>
          </>
        )}
        <small>
          {visibleMeta || 'GENERAL DENTISTRY | ORTHODONTICS | ENDODONTICS | ORAL SURGERY'}
        </small>
      </div>
    </div>
  );
}
