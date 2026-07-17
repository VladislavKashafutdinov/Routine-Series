import './RewardHistoryTab.css';

import type { ActivityWithStreak, RewardIssue } from '../../types';
import { memo, useState } from 'react';

import { Paginator } from '../Paginator/Paginator';
import { RewardCounters } from '../RewardCounters/RewardCounters';
import { useActivities } from '../../hooks/useActivities';
import { useLocale } from '../../i18n/LocaleContext';

const PER_PAGE = 50;

interface Props {
  activity: ActivityWithStreak;
  onIssue: (currency: string, amount: number) => void;
}

interface EditState {
  id: number;
  field: 'date' | 'amount' | 'currency';
}

function EditableCell({
  issue,
  field,
  editing,
  onEdit,
  onSave,
}: {
  issue: RewardIssue;
  field: EditState['field'];
  editing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
}) {
  const raw = issue[field];
  const display = typeof raw === 'number' ? String(raw) : raw;

  if (!editing) {
    return (
      <td className="rtable__cell" onClick={onEdit} title="Click to edit">
        {display}
      </td>
    );
  }

  const isNumber = field === 'amount';

  return (
    <td>
      <input
        className="rtable__edit"
        type={isNumber ? 'number' : 'text'}
        defaultValue={display}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave((e.target as HTMLInputElement).value);
          if (e.key === 'Escape') onEdit(); // cancel → close
        }}
        onBlur={(e) => onSave(e.target.value)}
        autoFocus
      />
    </td>
  );
}

export const RewardHistoryTab = memo(function RewardHistoryTab({ activity, onIssue }: Props) {
  const { t } = useLocale();
  const { updateRewardIssue, deleteRewardIssue } = useActivities();
  const [page, setPage] = useState(0);
  const [edit, setEdit] = useState<EditState | null>(null);

  const issues = [...activity.rewardIssues].sort((a, b) => b.date.localeCompare(a.date));
  const total = issues.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const paged = issues.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const handleSave = async (issue: RewardIssue, field: EditState['field'], value: string) => {
    const trimmed = value.trim();
    if (!trimmed) { setEdit(null); return; }

    const updates: { date?: string; amount?: number; currency?: string } = {};
    if (field === 'date') updates.date = trimmed;
    else if (field === 'amount') updates.amount = Number(trimmed) || 0;
    else updates.currency = trimmed;

    await updateRewardIssue(issue.id!, updates.amount ?? issue.amount, updates.currency ?? issue.currency, updates.date ?? issue.date);
    setEdit(null);
  };

  if (total === 0) {
    return (
      <>
        <RewardCounters activity={activity} onIssue={onIssue} />
        <div className="accordion__placeholder">{t.noRewardsYet}</div>
      </>
    );
  }

  return (
    <>
      <RewardCounters activity={activity} onIssue={onIssue} />
      <table className="rtable">
        <thead>
          <tr>
            <th>{t.rewardDate}</th>
            <th>{t.rewardAmount}</th>
            <th>{t.rewardCurrency}</th>
            <th>{t.rewardActions}</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((r) => (
            <tr key={r.id}>
              <EditableCell
                issue={r}
                field="date"
                editing={edit?.id === r.id && edit?.field === 'date'}
                onEdit={() => setEdit({ id: r.id!, field: 'date' })}
                onSave={(v) => handleSave(r, 'date', v)}
              />
              <EditableCell
                issue={r}
                field="amount"
                editing={edit?.id === r.id && edit?.field === 'amount'}
                onEdit={() => setEdit({ id: r.id!, field: 'amount' })}
                onSave={(v) => handleSave(r, 'amount', v)}
              />
              <EditableCell
                issue={r}
                field="currency"
                editing={edit?.id === r.id && edit?.field === 'currency'}
                onEdit={() => setEdit({ id: r.id!, field: 'currency' })}
                onSave={(v) => handleSave(r, 'currency', v)}
              />
              <td>
                <button className="rtable__del-btn" onClick={() => {
                  if (confirm(t.deleteConfirm(String(r.amount) + r.currency))) {
                    deleteRewardIssue(r.id!);
                  }
                }} type="button">
                  {t.deleteTitle}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paginator
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />
    </>
  );
});
