const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    let detail: unknown = undefined;
    try { detail = await res.json(); } catch { /* ignore */ }
    const err = new Error((detail as { detail?: string })?.detail || `HTTP ${res.status}`);
    (err as Error & { status?: number; body?: unknown }).status = res.status;
    (err as Error & { status?: number; body?: unknown }).body = detail;
    throw err;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

