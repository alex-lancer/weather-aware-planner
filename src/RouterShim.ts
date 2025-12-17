// Simple shim to make router helpers mockable in unit tests without pulling full react-router-dom
// Use lazy requires so unit tests can mock this file without importing react-router-dom eagerly.

function loadRR(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-router-dom');
  } catch {
    return null;
  }
}

export function redirect(...args: any[]) {
  const rr = loadRR();
  if (rr?.redirect) {
    return rr.redirect(...args);
  }
  // Fallback for test environments where react-router-dom isn't available.
  // Emulate a minimal redirect Response compatible with consumers.
  const to = args[0];
  const location = typeof to === 'string' ? to : (to?.toString?.() ?? '/');
  const headers = new Headers();
  headers.set('Location', location);
  return new Response(null, { status: 302, headers });
}

export function defer(data: any) {
  const rr = loadRR();
  if (rr?.defer) {
    return rr.defer(data);
  }
  // Fallback: just return the data as-is (no-op) so loaders can be unit-tested
  return data;
}
