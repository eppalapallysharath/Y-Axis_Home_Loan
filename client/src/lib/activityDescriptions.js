/**
 * Human-readable Activity History description generator and styling helpers
 */

const formatStage = (s) => (s ? s.replace(/_/g, ' ') : '—');
const formatLoanType = (t) => {
  if (!t) return 'Home Loan';
  if (t === 'HOME_LOAN') return 'Home Loan';
  if (t === 'TOP_UP') return 'Top-Up Loan';
  if (t === 'LAP') return 'Loan Against Property';
  return t.replace(/_/g, ' ');
};
const formatWorkItemType = (t) => (t ? t.replace(/_/g, ' ') : 'Task');

const formatCurrency = (n) => {
  if (!n || isNaN(n)) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
};

/**
 * Format relative time (e.g. "Just now", "5m ago", "2h ago", "1d ago", "3d ago")
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return '1d ago';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Determines whether a date divider line should be rendered above log item at index
 */
export function shouldShowDateDivider(logs, index) {
  if (!logs || index === 0) return true;
  const current = new Date(logs[index].createdAt).toDateString();
  const previous = new Date(logs[index - 1].createdAt).toDateString();
  return current !== previous;
}

/**
 * Format date divider label (e.g. "Today", "Yesterday", "23 Aug 2026")
 */
export function formatDateDivider(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get human readable natural language activity text
 */
export function getActivityDescription(log) {
  if (!log) return 'Activity recorded';

  const { action, metadata: m, user } = log;
  const actor = user?.name || 'System';

  switch (action) {
    case 'APPLICATION_CREATED':
    case 'CREATED': {
      const typeStr = formatLoanType(m?.loanType);
      const amtStr = formatCurrency(m?.loanAmount);
      return `${actor} created this application (${typeStr}${amtStr !== '—' ? ` — ${amtStr}` : ''})`;
    }

    case 'APPLICATION_ASSIGNED':
    case 'ASSIGNED': {
      const target = m?.newAssigneeName || m?.assignedToName || 'an executive';
      return `${actor} assigned application to ${target}`;
    }

    case 'APPLICATION_REASSIGNED':
    case 'REASSIGNED': {
      const prev = m?.previousAssigneeName || 'Unassigned';
      const curr = m?.newAssigneeName || 'Unassigned';
      return `${actor} reassigned application from ${prev} to ${curr}`;
    }

    case 'STATUS_CHANGED': {
      if (m?.toStage === 'REJECTED') {
        return `${actor} rejected this application${m?.rejectionReason ? ` — "${m.rejectionReason}"` : ''}`;
      }
      const fromStr = formatStage(m?.fromStage);
      const toStr = formatStage(m?.toStage);
      if (m?.reopened) {
        return `${actor} reopened application and moved stage to ${toStr}`;
      }
      return `${actor} moved application from ${fromStr} → ${toStr}`;
    }

    case 'APPLICATION_REJECTED': {
      return `${actor} rejected this application — "${m?.rejectionReason || 'No reason provided'}"`;
    }

    case 'WORK_ITEM_CREATED': {
      if (m?.bulk) {
        return `${actor} applied standard verification checklist (${m.count || m.types?.length || 4} tasks created)`;
      }
      return `${actor} created task "${m?.workItemTitle || 'Work Item'}" [${formatWorkItemType(m?.type)}]`;
    }

    case 'WORK_ITEM_UPDATED':
    case 'WORK_ITEM_STATUS_UPDATED': {
      return `${actor} updated "${m?.workItemTitle || 'task'}" from ${m?.fromStatus || 'OPEN'} to ${m?.toStatus || 'IN_PROGRESS'}`;
    }

    case 'WORK_ITEM_COMPLETED': {
      return `${actor} completed task "${m?.workItemTitle || 'Work Item'}" [${formatWorkItemType(m?.type)}]`;
    }

    case 'CBS_SYNC_INITIATED': {
      return `System initiated Core Banking sync (attempt #${m?.attempt || 1})`;
    }

    case 'CBS_SYNC_SUCCESS': {
      const dur = m?.durationMs ? ` in ${m.durationMs}ms` : '';
      return `Core Banking sync succeeded (attempt #${m?.attempt || 1}${dur})`;
    }

    case 'CBS_SYNC_FAILED': {
      const err = m?.errorMessage ? ` — ${m.errorMessage}` : '';
      return `Core Banking sync failed (attempt #${m?.attempt || 1})${err}`;
    }

    case 'CBS_SYNC_EXHAUSTED': {
      return `Core Banking sync exhausted all ${m?.totalAttempts || 4} attempts — manual retry required`;
    }

    case 'NOTE_ADDED': {
      return `${actor} added a note`;
    }

    default:
      return `${actor} performed action (${action})`;
  }
}

/**
 * Returns dot styling & badge properties based on action category
 */
export function getActivityBadgeProps(action) {
  switch (action) {
    case 'APPLICATION_CREATED':
    case 'CREATED':
      return {
        dotColor: 'bg-emerald-500 ring-emerald-100',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Created',
        category: 'LIFECYCLE',
      };

    case 'APPLICATION_ASSIGNED':
    case 'ASSIGNED':
    case 'APPLICATION_REASSIGNED':
    case 'REASSIGNED':
      return {
        dotColor: 'bg-blue-500 ring-blue-100',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        label: 'Assigned',
        category: 'ASSIGNMENT',
      };

    case 'STATUS_CHANGED':
      return {
        dotColor: 'bg-purple-500 ring-purple-100',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
        label: 'Stage',
        category: 'STAGE',
      };

    case 'APPLICATION_REJECTED':
      return {
        dotColor: 'bg-rose-600 ring-rose-100',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        label: 'Rejected',
        category: 'STAGE',
      };

    case 'WORK_ITEM_CREATED':
      return {
        dotColor: 'bg-teal-500 ring-teal-100',
        badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
        label: 'Task',
        category: 'WORK_ITEM',
      };

    case 'WORK_ITEM_UPDATED':
    case 'WORK_ITEM_STATUS_UPDATED':
      return {
        dotColor: 'bg-slate-500 ring-slate-100',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        label: 'Task',
        category: 'WORK_ITEM',
      };

    case 'WORK_ITEM_COMPLETED':
      return {
        dotColor: 'bg-emerald-600 ring-emerald-100',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Task ✓',
        category: 'WORK_ITEM',
      };

    case 'CBS_SYNC_INITIATED':
    case 'CBS_SYNC_SUCCESS':
      return {
        dotColor: 'bg-sky-500 ring-sky-100',
        badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
        label: 'CBS Sync',
        category: 'CBS',
      };

    case 'CBS_SYNC_FAILED':
    case 'CBS_SYNC_EXHAUSTED':
      return {
        dotColor: 'bg-amber-500 ring-amber-100',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        label: 'CBS ⚠',
        category: 'CBS',
      };

    case 'NOTE_ADDED':
      return {
        dotColor: 'bg-amber-400 ring-amber-100',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        label: 'Note 📝',
        category: 'NOTE',
      };

    default:
      return {
        dotColor: 'bg-slate-400 ring-slate-100',
        badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
        label: 'Event',
        category: 'OTHER',
      };
  }
}
