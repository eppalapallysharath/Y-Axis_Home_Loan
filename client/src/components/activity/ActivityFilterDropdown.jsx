'use client';

export default function ActivityFilterDropdown({ selectedCategory, onSelectCategory }) {
  const CATEGORIES = [
    { key: 'ALL', label: 'All Activities', actions: [] },
    { key: 'STAGE', label: 'Stage & Workflow', actions: ['STATUS_CHANGED', 'APPLICATION_REJECTED'] },
    {
      key: 'TASKS',
      label: 'Work Items / Tasks',
      actions: ['WORK_ITEM_CREATED', 'WORK_ITEM_UPDATED', 'WORK_ITEM_STATUS_UPDATED', 'WORK_ITEM_COMPLETED'],
    },
    { key: 'NOTES', label: 'Manual Notes 📝', actions: ['NOTE_ADDED'] },
    {
      key: 'CBS',
      label: 'Core Banking Sync',
      actions: ['CBS_SYNC_INITIATED', 'CBS_SYNC_SUCCESS', 'CBS_SYNC_FAILED', 'CBS_SYNC_EXHAUSTED'],
    },
  ];

  const handleChange = (e) => {
    const val = e.target.value;
    const cat = CATEGORIES.find((c) => c.key === val);
    if (cat) {
      onSelectCategory(cat.key, cat.actions);
    }
  };

  return (
    <select
      value={selectedCategory || 'ALL'}
      onChange={handleChange}
      className="text-xs bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-medium py-1.5 px-2.5 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
    >
      {CATEGORIES.map((cat) => (
        <option key={cat.key} value={cat.key}>
          {cat.label}
        </option>
      ))}
    </select>
  );
}
