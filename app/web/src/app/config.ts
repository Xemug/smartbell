// Deployment config for the shell. `whatsapp-support` moves the number behind the api, so it can
// change without a deploy; until then VITE_WHATSAPP_NUMBER overrides it at build time.
export const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER ?? '523334056398';
