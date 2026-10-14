const TARGET_HASH = '0cad93d300fda766cca05c95859d8f230efb7ec010846910a511f11f7f6b80a6';
const AUTH_SESSION_KEY = 'moms_kitchen_edit_auth_v1';

export function normalizeAnswer(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

export async function hashAnswer(input: string): Promise<string> {
  const normalized = normalizeAnswer(input);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(input: string): Promise<boolean> {
  const inputHash = await hashAnswer(input);
  return inputHash === TARGET_HASH;
}

export function isSessionAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSessionAuthenticated(authenticated: boolean): void {
  try {
    if (authenticated) {
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    } else {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}
