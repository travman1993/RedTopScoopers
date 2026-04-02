import crypto from 'crypto';

// Derives a deterministic session token from SESSION_SECRET using HMAC-SHA256.
// The raw secret never lives in the cookie — only this derived token does.
// Rotating SESSION_SECRET instantly invalidates all existing sessions.
function createSessionToken(secret) {
  return crypto.createHmac('sha256', secret).update('rts-admin-v1').digest('hex');
}

export { createSessionToken };

// Validates the rts_session cookie on an incoming request.
// Uses timing-safe comparison to prevent timing attacks.
export function validateAdminSession(request) {
  const session = request.cookies.get('rts_session');
  const secret = process.env.SESSION_SECRET;
  if (!session?.value || !secret) return false;
  try {
    const expected = Buffer.from(createSessionToken(secret));
    const actual = Buffer.from(session.value);
    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
