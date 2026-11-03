import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import { FormField } from '../../ui/FormField';
import { TextField } from '../../ui/TextField';
import { AuthLayout } from './AuthLayout';
import { authErrorKey } from './errors';
import { FormError } from './FormError';
import { SwitchLink } from './SwitchLink';
import { useAuth } from './useAuth';

const schema = z.object({
  email: z.string().trim().min(1, 'validation.required').email('auth.validation.email'),
});

/** Not drawn in V4; uses Firebase's reset email (docs/roadmap/auth.md). */
export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (failure) {
      setError(authErrorKey(failure));
    }
  });

  return (
    <AuthLayout title={t('auth.forgot.title')}>
      <h2 className="text-center text-primary type-heading-md">{t('auth.forgot.title')}</h2>
      {sent ? (
        <div role="status">
          <Banner tone="success">{t('auth.forgot.sent')}</Banner>
        </div>
      ) : (
        <>
          <p className="text-center type-body-md">{t('auth.forgot.intro')}</p>
          <FormError messageKey={error} />
          <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
            <FormField
              control={control}
              name="email"
              render={(field) => (
                <TextField
                  {...field}
                  type="email"
                  autoComplete="email"
                  label={t('auth.fields.email')}
                  placeholder={t('auth.placeholders.email')}
                />
              )}
            />
            <Button type="submit" size="lg" fullWidth loading={formState.isSubmitting}>
              {t('auth.forgot.submit')}
            </Button>
          </form>
        </>
      )}
      <SwitchLink
        question={t('auth.forgot.remembered')}
        action={t('auth.clickHere')}
        to="/entrar"
      />
    </AuthLayout>
  );
}
