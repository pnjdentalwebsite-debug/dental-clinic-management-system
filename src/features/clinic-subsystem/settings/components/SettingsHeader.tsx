interface Props {
  moduleTitle: string;
}

export function SettingsHeader({ moduleTitle }: Props) {
  return (
    <header className="settings-header">
      <div className="settings-header__copy">
        <p className="settings-header__eyebrow">Settings</p>
        <h2>{moduleTitle}</h2>
      </div>
    </header>
  );
}
