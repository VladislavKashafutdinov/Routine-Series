import { memo } from 'react';

interface Props {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export const Paginator = memo(function Paginator({ page, totalPages, onPrev, onNext }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="paginator">
      <button
        className="paginator__btn"
        disabled={page === 0}
        onClick={onPrev}
        type="button"
      >
        ◀
      </button>
      <span className="paginator__info">{page + 1} / {totalPages}</span>
      <button
        className="paginator__btn"
        disabled={page >= totalPages - 1}
        onClick={onNext}
        type="button"
      >
        ▶
      </button>
    </div>
  );
});
