import { memo } from 'react';
import './TabSwitcher.css';

interface Tab {
  key: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  active: string;
  onSelect: (key: string) => void;
}

export const TabSwitcher = memo(function TabSwitcher({ tabs, active, onSelect }: Props) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tabs__tab ${active === tab.key ? 'tabs__tab--active' : ''}`}
          onClick={() => onSelect(tab.key)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
});
