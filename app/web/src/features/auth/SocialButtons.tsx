import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../ui/Button';
import type { SocialProvider } from './backend';
import { authErrorKey, isCancelled } from './errors';
import { useAuth } from './useAuth';

// V4 draws Google in a light blue that white text can't be read on; primary keeps the contrast.
// Facebook is drawn in V4 but waits on the user's go-ahead (docs/roadmap/auth.md). Apple is
// required by the App Store whenever Google is offered.
const providers: { id: SocialProvider; label: string; className: string }[] = [
  { id: 'google', label: 'Google', className: '!bg-primary hover:!bg-primary/90' },
  { id: 'apple', label: 'Apple', className: '!bg-primary-text hover:!bg-primary-text/90' },
];

/** `above` the form (mobile, V4): "Acceder con: … O proporciona tus datos:". `below` (web, W 1-146):
 * "ó Registrarme con …". */
export function SocialButtons({
  onError,
  placement = 'above',
}: {
  onError: (key: string | null) => void;
  placement?: 'above' | 'below';
}) {
  const { t } = useTranslation();
  const { signInWith } = useAuth();
  const [busy, setBusy] = useState<SocialProvider | null>(null);

  const start = async (provider: SocialProvider) => {
    onError(null);
    setBusy(provider);
    try {
      await signInWith(provider);
    } catch (error) {
      if (!isCancelled(error)) onError(authErrorKey(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {placement === 'below' && (
        <p className="text-center text-primary type-body-md">{t('auth.or')}</p>
      )}
      <p className="text-center text-primary type-body-lg">
        {t(placement === 'above' ? 'auth.accessWith' : 'auth.signUpWith')}
      </p>
      {providers.map(({ id, label, className }) => (
        <Button
          key={id}
          size="lg"
          fullWidth
          loading={busy === id}
          disabled={busy !== null}
          className={className}
          aria-label={t('auth.continueWith', { provider: label })}
          onClick={() => void start(id)}
        >
          {label}
        </Button>
      ))}
      {placement === 'above' && (
        <p className="text-center text-primary type-body-lg">{t('auth.orDetails')}</p>
      )}
    </div>
  );
}
