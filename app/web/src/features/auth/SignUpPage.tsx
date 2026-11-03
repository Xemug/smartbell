import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { termsUrl } from '../../app/config';
import { useIsDesktop } from '../../app/useIsDesktop';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { cx, focusRing } from '../../ui/cx';
import { FormField } from '../../ui/FormField';
import { PhoneField } from '../../ui/PhoneField';
import { TextField } from '../../ui/TextField';
import { AuthLayout } from './AuthLayout';
import { authErrorKey } from './errors';
import { FormError } from './FormError';
import { SocialButtons } from './SocialButtons';
import { SwitchLink } from './SwitchLink';
import { useAuth } from './useAuth';

const MIN_PASSWORD = 6; // Firebase's own minimum.

const schema = z
  .object({
    name: z.string().trim().min(1, 'validation.required').max(100),
    // +52 numbers have 10 digits; other codes are checked only for a plausible E.164 length.
    phone: z
      .string()
      .min(1, 'validation.required')
      .refine((v) => (v.startsWith('+52') ? /^\+52\d{10}$/ : /^\+[1-9]\d{7,14}$/).test(v), {
        message: 'validation.phone',
      }),
    email: z.string().trim().min(1, 'validation.required').email('auth.validation.email'),
    password: z.string().min(MIN_PASSWORD, 'auth.validation.passwordLength'),
    confirm: z.string().min(1, 'validation.required'),
    terms: z.boolean().refine(Boolean, { message: 'auth.validation.terms' }),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'auth.validation.passwordMismatch',
  });
type Values = z.infer<typeof schema>;

/** V 2901-5565 on mobile, W 1-146 on the web. No ranch fields: "Mi rancho" is made for them. */
export function SignUpPage() {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const { signUp, state } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', password: '', confirm: '', terms: false },
  });
  const sessionError =
    state.status === 'signedOut' && state.error ? authErrorKey(state.error) : null;

  const submit = handleSubmit(async ({ name, phone, email, password }) => {
    setError(null);
    try {
      await signUp({ name, phone, email, password });
    } catch (failure) {
      setError(authErrorKey(failure));
    }
  });

  const termsLabel = (
    <span className="type-body-md">
      {t('auth.signup.acceptTerms')}{' '}
      {termsUrl ? (
        <a
          href={termsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cx('text-primary underline', focusRing)}
        >
          {t('auth.signup.terms')}
        </a>
      ) : (
        t('auth.signup.terms')
      )}
    </span>
  );

  return (
    <AuthLayout title={t('auth.signup.title')}>
      {!isDesktop && <SocialButtons onError={setError} />}
      <FormError messageKey={error ?? sessionError} />
      <form
        noValidate
        onSubmit={(event) => void submit(event)}
        className={cx('grid gap-4', isDesktop && 'grid-cols-2')}
      >
        <FormField
          control={control}
          name="name"
          render={(field) => (
            <TextField
              {...field}
              autoComplete="name"
              label={t('auth.fields.name')}
              placeholder={t('auth.fields.name')}
              className={cx(isDesktop && 'col-span-2')}
            />
          )}
        />
        <FormField
          control={control}
          name="phone"
          render={(field) => (
            <PhoneField {...field} label={t('auth.fields.phone')} placeholder="33-3456-7890" />
          )}
        />
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
              autoComplete="new-password"
              label={t('auth.fields.password')}
            />
          )}
        />
        <FormField
          control={control}
          name="confirm"
          render={(field) => (
            <TextField
              {...field}
              type="password"
              autoComplete="new-password"
              label={t('auth.fields.confirm')}
            />
          )}
        />
        <div className={cx('flex items-start justify-center gap-2', isDesktop && 'col-span-2')}>
          <FormField
            control={control}
            name="terms"
            render={({ error: termsError, ...field }) => (
              <Checkbox
                {...field}
                aria-label={t('auth.signup.acceptTermsFull')}
                error={termsError}
              />
            )}
          />
          {termsLabel}
        </div>
        <Button
          type="submit"
          size="lg"
          loading={formState.isSubmitting}
          className={cx(
            'justify-self-center !bg-alternate px-8 !text-primary-text hover:!bg-alternate/90',
            isDesktop && 'col-span-2',
          )}
        >
          {t(isDesktop ? 'auth.signup.submitWeb' : 'auth.signup.submit')}
        </Button>
      </form>
      {isDesktop && <SocialButtons onError={setError} placement="below" />}
      <SwitchLink
        question={t('auth.signup.haveAccount')}
        action={t('auth.clickHere')}
        to="/entrar"
      />
    </AuthLayout>
  );
}
