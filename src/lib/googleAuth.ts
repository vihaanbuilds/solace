// Thin wrapper around Google Identity Services (GIS) for a lightweight
// "sign in with Google" that personalizes the greeting — Solace still has
// no backend and no accounts system, so this never gates functionality or
// syncs data anywhere; it only decodes the ID token client-side to read a
// name/email/picture and stores that locally, same as everything else here.
export interface GoogleProfile {
  name: string;
  email: string;
  picture: string;
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const PROFILE_KEY = 'solace.googleProfile';

let scriptLoadPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('')
  );
  return JSON.parse(json);
}

export function getGoogleClientId(): string | undefined {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID;
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(getGoogleClientId());
}

export async function renderGoogleSignInButton(
  container: HTMLElement,
  onSignIn: (profile: GoogleProfile) => void
): Promise<void> {
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID is not configured');

  await loadGisScript();

  // Guard against React StrictMode's dev-only double-invoke (or any other
  // re-render) calling initialize() more than once for the same client —
  // GIS logs a warning and only keeps the last call anyway, so skipping
  // repeats is strictly safer, not just quieter.
  if (initializedClientId !== clientId) {
    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        const payload = decodeJwtPayload(response.credential);
        const profile: GoogleProfile = {
          name: String(payload.name ?? ''),
          email: String(payload.email ?? ''),
          picture: String(payload.picture ?? ''),
        };
        saveGoogleProfile(profile);
        onSignIn(profile);
      },
    });
    initializedClientId = clientId;
  }

  window.google!.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text: 'continue_with',
    logo_alignment: 'left',
  });
}

export function saveGoogleProfile(profile: GoogleProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadGoogleProfile(): GoogleProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GoogleProfile;
  } catch {
    return null;
  }
}

export function clearGoogleProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}
