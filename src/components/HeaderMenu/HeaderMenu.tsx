import { useEffect, useRef, useState } from 'react';
import { DataActions } from '@components/DataActions/DataActions';
import { LangSwitcher } from '@components/LangSwitcher/LangSwitcher';
import { Spinner } from '@components/Spinner/Spinner';
import { TimeTravel } from '@components/TimeTravel/TimeTravel';
import { useAuth } from '@/hooks/AuthContext';
import { useLocale } from '@/i18n/LocaleContext';
import './HeaderMenu.css';

interface Props {
  /** Switches the page to the archive tab. */
  onOpenArchive: () => void;
}

/** Top-right dropdown with language, archive, export/import, time travel and logout. */
export function HeaderMenu({ onOpenArchive }: Props) {
  const { logout } = useAuth();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="header-menu" ref={rootRef}>
      <button
        className="header-menu__btn"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title={t.menuButton}
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>
      {open && (
        <div className="header-menu__dropdown" role="menu">
          <div className="header-menu__row">
            <LangSwitcher />
          </div>
          <div className="header-menu__row">
            <button
              className="header-menu__archive"
              type="button"
              onClick={() => {
                onOpenArchive();
                setOpen(false);
              }}
            >
              {t.archiveTitle}
            </button>
          </div>
          <div className="header-menu__row">
            <DataActions />
          </div>
          <div className="header-menu__row">
            <TimeTravel />
          </div>
          <div className="header-menu__row">
            <button
              className="header-menu__logout"
              type="button"
              disabled={loggingOut}
              onClick={() => {
                setLoggingOut(true);
                void logout().finally(() => setLoggingOut(false));
              }}
            >
              {loggingOut ? <Spinner /> : t.logoutButton}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
