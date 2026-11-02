import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '../../ui/Button';
import { cx, focusRing } from '../../ui/cx';
import { FormField } from '../../ui/FormField';
import { TextField } from '../../ui/TextField';
import { AuthLayout } from './AuthLayout';
import { authErrorKey } from './errors';
import { FormError } from './FormError';
import { SocialButtons } from './SocialButtons';
import { SwitchLink } from './SwitchLink';
import { useAuth } from './useAuth';

const schema = z.object({
  email: z.string().trim().min(1, 'validation.required').email('auth.validation.email'),
  password: z.string().min(1, 'validation.required'),
});
type Values = z.infer<typeof schema>;

/** V 3291-9399. "Usuario" asks for the email, which is what Firebase signs in with. */
export function LoginPage() {
  const { t } = useTranslation();
  const { signIn, state } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const sessionError =
    state.status === 'signedOut' && state.error ? authErrorKey(state.error) : null;

  const submit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      await signIn(email, password);
    } catch (failure) {
      setError(authErrorKey(failure));
    }
  });

  return (
    <AuthLayout title={t('auth.login.title')}>
      <SocialButtons onError={setError} />
      <FormError messageKey={error ?? sessionError} />
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
        <FormField
          control={control}
          name="password"
          render={(field) => (
            <TextField
              {...field}
              type="password"
              autoComplete="current-password"
              label={t('auth.fields.password')}
            />
          )}
        />
        <Link
          to="/recuperar"
          className={cx('self-end text-primary underline type-body-md', focusRing)}
        >
          {t('auth.login.forgot')}
        </Link>
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={formState.isSubmitting}
          className="!bg-alternate !text-primary-text hover:!bg-alternate/90"
        >
          {t('auth.login.submit')}
        </Button>
      </form>
      <SwitchLink
        question={t('auth.login.noAccount')}
        action={t('auth.clickHere')}
        to="/registro"
      />
    </AuthLayout>
  );
}
