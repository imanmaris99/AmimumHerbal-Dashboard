export function extractApiErrorMessage(error: any, fallback: string): string {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const joined = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.msg && item?.loc) return `${item.loc.join('.')} - ${item.msg}`;
        if (item?.msg) return item.msg;
        return null;
      })
      .filter(Boolean)
      .join('; ');

    if (joined) return joined;
  }

  if (detail && typeof detail === 'object') {
    if (typeof detail.message === 'string' && detail.message.trim()) {
      return detail.message;
    }

    const values = Object.values(detail)
      .map((value) => {
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return value.join(', ');
        return null;
      })
      .filter(Boolean)
      .join('; ');

    if (values) return values;
  }

  const message = error?.response?.data?.message || error?.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
}
