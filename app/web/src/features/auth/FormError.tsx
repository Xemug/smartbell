import { useTranslation } from 'react-i18next';

import { Banner } from '../../ui/Banner';

export function FormError({ messageKey }: { messageKey: string | null | undefined }) {
  const { t } = useTranslation();
  if (!messageKey) return null;
  return <Banner tone="error">{t(messageKey)}</Banner>; // An error Banner is a role="alert".
}
