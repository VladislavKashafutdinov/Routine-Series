import { useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { Spinner } from '@components/Spinner/Spinner';
import './PullToRefresh.css';

const PULL_THRESHOLD = 70;

interface Props {
  refreshing: boolean;
  onRefresh: () => void;
  children: ReactNode;
}

/** Mobile pull-to-refresh: drag down at the top of the page to reload data. */
export function PullToRefresh({ refreshing, onRefresh, children }: Props) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (refreshing || window.scrollY !== 0) return;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (startY.current === null || window.scrollY !== 0) return;
    const delta = e.touches[0].clientY - startY.current;
    setPull(delta > 0 ? Math.min(delta * 0.5, 100) : 0);
  };

  const onTouchEnd = () => {
    if (startY.current !== null && pull >= PULL_THRESHOLD && !refreshing) {
      onRefresh();
    }
    startY.current = null;
    setPull(0);
  };

  return (
    <div
      className="pull-refresh"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div className="pull-refresh__indicator" style={{ height: refreshing ? 36 : pull }}>
        {(refreshing || pull > 0) && <Spinner />}
      </div>
      {children}
    </div>
  );
}
