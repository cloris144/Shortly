const BASE = '/api/links';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    const err = new Error(data?.message || 'Something went wrong.');
    err.code = data?.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const fetchLinks = () => request(BASE);

export const createLink = (originalUrl) =>
  request(BASE, { method: 'POST', body: JSON.stringify({ originalUrl }) });

export const updateLink = (id, originalUrl) =>
  request(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify({ originalUrl }) });

export const deleteLink = (id) =>
  request(`${BASE}/${id}`, { method: 'DELETE' });

export const fetchClicks = (id) =>
  request(`${BASE}/${id}/clicks`);
