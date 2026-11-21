/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Hosted builds: Google map tiles with this browser key. Unset: OpenStreetMap's tiles (dev). */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  /** Hosted builds: "true" sends address lookups through the API (Google). Unset: Nominatim. */
  readonly VITE_GEOCODE_VIA_API?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_TERMS_URL?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  /** Dev only, and only with a demo- project. Defaults to http://127.0.0.1:9099. */
  readonly VITE_FIREBASE_AUTH_EMULATOR_URL?: string;
}
