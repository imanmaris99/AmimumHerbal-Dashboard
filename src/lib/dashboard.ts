export const orderStatusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  paid: 'bg-emerald-50 text-emerald-600',
  processing: 'bg-blue-50 text-blue-600',
  shipped: 'bg-cyan-50 text-cyan-600',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-rose-50 text-rose-600',
  failed: 'bg-red-50 text-red-600',
};

export const paymentStatusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  settlement: 'bg-emerald-50 text-emerald-600',
  expire: 'bg-slate-100 text-slate-600',
  cancel: 'bg-rose-50 text-rose-600',
  deny: 'bg-red-50 text-red-600',
  refund: 'bg-violet-50 text-violet-600',
  capture: 'bg-blue-50 text-blue-600',
};

export const userRoleStyles: Record<string, string> = {
  owner: 'bg-orange-50 text-orange-600',
  admin: 'bg-blue-50 text-blue-600',
  customer: 'bg-gray-100 text-gray-600',
};

export const userStatusStyles = {
  active: 'bg-green-50 text-green-600',
  inactive: 'bg-red-50 text-red-500',
};

export function getStatusStyle(map: Record<string, string>, value?: string | null, fallback = 'bg-gray-100 text-gray-600') {
  if (!value) return fallback;
  return map[value.toLowerCase()] || fallback;
}
