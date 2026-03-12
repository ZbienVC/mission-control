export function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Failed to save to localStorage');
  }
}

export function removeItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    console.error('Failed to remove from localStorage');
  }
}

export function getAllKeys(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return Object.keys(window.localStorage);
  } catch {
    return [];
  }
}

export function exportAll(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  const data: Record<string, unknown> = {};
  for (const key of getAllKeys()) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) data[key] = JSON.parse(raw);
    } catch {
      // skip
    }
  }
  return data;
}

export function importAll(data: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  for (const [key, value] of Object.entries(data)) {
    setItem(key, value);
  }
}

export function resetAll(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.clear();
}
