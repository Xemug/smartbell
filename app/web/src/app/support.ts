import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { api } from '../api/client';
import type { components } from '../api/schema';
import { whatsappNumber } from './config';
import type { NavId } from './navigation';
import { whatsappUrl } from './whatsapp';

export type SupportConfig = components['schemas']['SupportConfigOut'];
export type FakeDoorFeature = components['schemas']['FakeDoorFeature'];

const FEATURE_PLACEHOLDER = '{nombre}';

/** The number and copy live behind the api, so support can change them without a deploy. */
export function useSupportConfig() {
  return useQuery({
    queryKey: ['support-config'],
    queryFn: async (): Promise<SupportConfig> => {
      const { data, error } = await api.GET('/api/support/config');
      if (error || !data) throw new Error('support config failed');
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * wa.me links for the support entry points. Until the config arrives (or if it can't), they use
 * the build's number and the app's translated copy, so a link is never missing.
 */
export function useSupportLinks() {
  const { t } = useTranslation();
  const { data } = useSupportConfig();
  // A blank or malformed number from the api must not leave the link pointing nowhere.
  const number = data?.whatsapp_number?.replace(/\D/g, '') || whatsappNumber;
  const link = (message: string) => whatsappUrl(message, number);
  return {
    support: link(data?.support_message || t('shell.supportPrefill')),
    payment: link(data?.payment_message || t('support.paymentPrefill')),
    feature: (nombre: string) =>
      link(
        data?.feature_message
          ? data.feature_message.replaceAll(FEATURE_PLACEHOLDER, nombre)
          : t('fakeDoor.prefill', { nombre }),
      ),
    community: data?.community_url ?? null,
  };
}

// Typed both ways: a new unbuilt tab won't compile until the api's allowlist knows it, so its taps
// can't be lost to a 422. Built tabs never open the fake door, but stay mapped in case they flip.
const fakeDoorFeatures: Record<Exclude<NavId, 'tareas' | 'vacas'>, FakeDoorFeature> = {
  grupos: 'GRUPOS',
  reportes: 'REPORTES',
  usuarios: 'USUARIOS',
  ranchos: 'RANCHOS',
};

/** Counts a tap on an unbuilt feature. Best effort: a failed count never blocks the modal. */
export async function recordFakeDoorTap(id: NavId): Promise<void> {
  const feature =
    id in fakeDoorFeatures ? fakeDoorFeatures[id as keyof typeof fakeDoorFeatures] : null;
  if (!feature) return;
  try {
    const { error } = await api.POST('/api/support/fake-door-taps', { body: { feature } });
    // HTTP errors come back as `error`, not thrown. Logged so a broken count is visible in dev.
    if (error) console.warn('fake-door tap not counted', error);
  } catch {
    // Offline: the demand signal is lost, the user isn't bothered.
  }
}
