import type { CSSProperties } from 'react';

export type DocumentHeaderItemKey = 'left-image' | 'clinic-info-logo' | 'right-photo';
export type DocumentMargins = { top: number; bottom: number; left: number; right: number };

export interface DocumentHeaderSettings {
  order: DocumentHeaderItemKey[];
  clinicName: string;
  showClinicName: boolean;
  address: string;
  showAddress: boolean;
  contact: string;
  showContact: boolean;
  bottomMargin: number;
  leftImageData: string;
  showLeftImage: boolean;
  showLeftImageOutline: boolean;
  leftImageSize: number;
  leftImageMargins: DocumentMargins;
  middleImageData: string;
  showMiddleImage: boolean;
  middleImageSize: number;
  middleImageMargins: DocumentMargins;
  rightImageData: string;
  showRightImage: boolean;
  imageFit: string;
  cropPositionX: number;
  cropPositionY: number;
  rightImageMargins: DocumentMargins;
}

interface ConfigurableDocumentHeaderProps {
  settings?: Partial<DocumentHeaderSettings>;
  compact?: boolean;
}

const defaultMargins: DocumentMargins = { top: 0, bottom: 0, left: 0, right: 0 };

const defaultSettings: DocumentHeaderSettings = {
  order: ['left-image', 'clinic-info-logo', 'right-photo'],
  clinicName: 'P & J TANARTE',
  showClinicName: true,
  address: 'BAYAN LUMA IV IMUS CAVITE',
  showAddress: true,
  contact: '0953 834 3062',
  showContact: true,
  bottomMargin: 8,
  leftImageData: '',
  showLeftImage: true,
  showLeftImageOutline: true,
  leftImageSize: 54,
  leftImageMargins: defaultMargins,
  middleImageData: '',
  showMiddleImage: false,
  middleImageSize: 50,
  middleImageMargins: defaultMargins,
  rightImageData: '',
  showRightImage: true,
  imageFit: 'Cover (Crop to fit)',
  cropPositionX: 50,
  cropPositionY: 50,
  rightImageMargins: defaultMargins
};

export function ConfigurableDocumentHeader({
  settings: suppliedSettings,
  compact = false
}: ConfigurableDocumentHeaderProps) {
  const settings: DocumentHeaderSettings = {
    ...defaultSettings,
    ...suppliedSettings,
    leftImageMargins: { ...defaultMargins, ...suppliedSettings?.leftImageMargins },
    middleImageMargins: { ...defaultMargins, ...suppliedSettings?.middleImageMargins },
    rightImageMargins: { ...defaultMargins, ...suppliedSettings?.rightImageMargins }
  };
  const style = {
    marginBottom: `${Math.max(0, settings.bottomMargin)}px`
  } as CSSProperties;

  return (
    <header className={`configurable-document-header ${compact ? 'is-compact' : ''}`} style={style}>
      {settings.order.map((itemKey) => {
        if (itemKey === 'left-image') {
          return <LeftImage key={itemKey} settings={settings} />;
        }
        if (itemKey === 'right-photo') {
          return <RightPhoto key={itemKey} settings={settings} />;
        }
        return <ClinicIdentity key={itemKey} settings={settings} />;
      })}
    </header>
  );
}

function LeftImage({ settings }: { settings: DocumentHeaderSettings }) {
  if (!settings.showLeftImage) {
    return <div className="configurable-document-header__side is-empty" data-header-item="left-image" />;
  }

  return (
    <div
      className={`configurable-document-header__side configurable-document-header__left ${
        settings.showLeftImageOutline ? 'has-outline' : ''
      }`}
      data-header-item="left-image"
      style={{
        width: `${Math.max(28, settings.leftImageSize)}px`,
        height: `${Math.max(28, settings.leftImageSize)}px`,
        margin: marginsToCss(settings.leftImageMargins)
      }}
    >
      {isImageData(settings.leftImageData) ? (
        <img src={settings.leftImageData} alt="Clinic left logo" />
      ) : (
        <ImagePlaceholderIcon />
      )}
    </div>
  );
}

function ClinicIdentity({ settings }: { settings: DocumentHeaderSettings }) {
  const showAnyIdentity = settings.showClinicName || settings.showAddress || settings.showContact;

  return (
    <div
      className="configurable-document-header__identity"
      data-header-item="clinic-info-logo"
      style={{ margin: marginsToCss(settings.middleImageMargins) }}
    >
      {settings.showMiddleImage && isImageData(settings.middleImageData) && (
        <img
          className="configurable-document-header__brand-image"
          src={settings.middleImageData}
          alt="Clinic brand logo"
          style={{ maxHeight: `${Math.max(24, settings.middleImageSize)}px` }}
        />
      )}
      {showAnyIdentity && (
        <div className="configurable-document-header__identity-text">
          {settings.showClinicName && <strong>{settings.clinicName}</strong>}
          {settings.showAddress && <span>{settings.address}</span>}
          {settings.showContact && <small>{settings.contact}</small>}
        </div>
      )}
    </div>
  );
}

function RightPhoto({ settings }: { settings: DocumentHeaderSettings }) {
  if (!settings.showRightImage) {
    return <div className="configurable-document-header__side is-empty" data-header-item="right-photo" />;
  }

  const fit = settings.imageFit.startsWith('Contain')
    ? 'contain'
    : settings.imageFit.startsWith('Stretch')
      ? 'fill'
      : 'cover';

  return (
    <div
      className="configurable-document-header__side configurable-document-header__photo"
      data-header-item="right-photo"
      style={{ margin: marginsToCss(settings.rightImageMargins) }}
    >
      {isImageData(settings.rightImageData) ? (
        <img
          src={settings.rightImageData}
          alt="Patient 2x2"
          style={{
            objectFit: fit,
            objectPosition: `${settings.cropPositionX}% ${settings.cropPositionY}%`
          }}
        />
      ) : (
        <span>2x2 Photo</span>
      )}
    </div>
  );
}

function marginsToCss(margins: DocumentMargins) {
  return `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`;
}

function isImageData(value: string) {
  return value.startsWith('data:image/');
}

function ImagePlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m6.5 17 4-4 2.6 2.5 1.8-1.8 2.6 3.3" />
    </svg>
  );
}
