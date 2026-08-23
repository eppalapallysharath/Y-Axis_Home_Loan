/**
 * Client Workflow Constants & Design Tokens
 * References: readme/MODULE_04_WORKFLOW.md & readme/DESIGN_SYSTEM.md
 */

export const CLIENT_VALID_TRANSITIONS = {
  NEW: ['WAITING_FOR_INFO', 'IN_PROGRESS'],
  WAITING_FOR_INFO: ['IN_PROGRESS'],
  IN_PROGRESS: ['UNDER_REVIEW', 'WAITING_FOR_INFO'],
  UNDER_REVIEW: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: ['IN_PROGRESS'],
  REJECTED: ['IN_PROGRESS'],
};

export const EXECUTIVE_BLOCKED_STAGES = ['COMPLETED', 'REJECTED', 'IN_PROGRESS'];

export const ROLE_ALLOWED_TRANSITIONS = {
  ADMIN: {
    NEW: ['WAITING_FOR_INFO', 'IN_PROGRESS'],
    WAITING_FOR_INFO: ['IN_PROGRESS'],
    IN_PROGRESS: ['UNDER_REVIEW', 'WAITING_FOR_INFO'],
    UNDER_REVIEW: ['COMPLETED', 'IN_PROGRESS'],
    COMPLETED: ['IN_PROGRESS'],
    REJECTED: ['IN_PROGRESS'],
  },
  MANAGER: {
    NEW: ['WAITING_FOR_INFO', 'IN_PROGRESS'],
    WAITING_FOR_INFO: ['IN_PROGRESS'],
    IN_PROGRESS: ['UNDER_REVIEW', 'WAITING_FOR_INFO'],
    UNDER_REVIEW: ['COMPLETED', 'IN_PROGRESS'],
    COMPLETED: ['IN_PROGRESS'],
    REJECTED: ['IN_PROGRESS'],
  },
  EXECUTIVE: {
    NEW: ['WAITING_FOR_INFO', 'IN_PROGRESS'],
    WAITING_FOR_INFO: ['IN_PROGRESS'],
    IN_PROGRESS: ['UNDER_REVIEW', 'WAITING_FOR_INFO'],
    UNDER_REVIEW: [],
    COMPLETED: [],
    REJECTED: [],
  },
};

export const STAGE_CONFIG = {
  NEW: {
    label: 'New',
    hex: '#64748b',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
  },
  WAITING_FOR_INFO: {
    label: 'Waiting for Info',
    hex: '#eab308',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    hex: '#0284c7',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-300',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    hex: '#8b5cf6',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-300',
  },
  COMPLETED: {
    label: 'Completed',
    hex: '#16a34a',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-300',
  },
  REJECTED: {
    label: 'Rejected',
    hex: '#dc2626',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-300',
  },
};

export const formatStageName = (stageKey) => {
  return STAGE_CONFIG[stageKey]?.label || stageKey?.replace(/_/g, ' ') || '';
};
