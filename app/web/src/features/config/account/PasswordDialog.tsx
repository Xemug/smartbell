import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '../../../ui/Button';
import { FormField } from '../../../ui/FormField';
import { Modal } from '../../../ui/Modal';
import { TextField } from '../../../ui/TextField';
import { useSnackbar } from '../../../ui/useSnackbar';
import { AuthError } from '../../auth/backend';
import { authErrorKey } from '../../auth/errors';
import { useAuth } from '../../auth/useAuth';

export const MIN_PASSWORD = 8; // Web 1.4 (2449:173794).

const schema = z
  .object({
    current: z.string().min(1, 'validation.required'),
    next: z.string().min(MIN_PASSWORD, 'config.account.password.length'),
    confirm: z.string().min(1, 'validation.required'),
  })
  .refine((v) => v.next !== v.current, {
    path: ['next'],
    message: 'config.account.password.same',
  })
  .refine((v) => v.confirm === v.next, {
    path: ['confirm'],
    message: 'config.account.password.mismatch',
  });
type Values = z.infer<typeof schema>;

const wrongCurrent = new Set([
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/wrong-password',
]);

/** M 1697-93556 / W 369:6506: current, new and confirm; Guardar only once all three are valid. */
export function PasswordDialog({
  open,
  onOpenChange,
  name,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
}) {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const snackbar = useSnackbar();
  const [failure, setFailure] = useState<string | null>(null);
  const { control, handleSubmit, formState, reset, setError } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { current: '', next: '', confirm: '' },
  });

  const close = (next: boolean) => {
    if (formState.isSubmitting) return;
    if (!next) {
      reset();
      setFailure(null);
    }
    onOpenChange(next);
  };

  const submit = handleSubmit(async ({ current, next }) => {
    setFailure(null);
    try {
      await changePassword(current, next);
    } catch (error) {
      const code = error instanceof AuthError ? error.code : '';
      if (wrongCurrent.has(code)) {
        setError('current', { message: 'config.account.password.wrongCurrent' });
      } else if (code === 'auth/weak-password') {
        setError('next', { message: 'config.account.password.length' });
      } else {
        setFailure(code ? authErrorKey(error) : 'config.account.password.error');
      }
      return;
    }
    snackbar.show({ kind: 'success', message: t('config.account.password.success', { name }) });
    close(false);
  });

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={t('config.account.password.title')}
      description={t('config.account.password.hint')}
    >
      <form id="change-password" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <FormField
          control={control}
          name="current"
          render={(field) => (
            <TextField
              {...field}
              type="password"
              autoComplete="current-password"
              label={t('config.account.password.current')}
              required
            />
          )}
        />
        <FormField
          control={control}
          name="next"
          render={(field) => (
            <TextField
              {...field}
              type="password"
              autoComplete="new-password"
              label={t('config.account.password.next')}
              required
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
              label={t('config.account.password.confirm')}
              required
            />
          )}
        />
        {failure && (
          <p role="alert" className="text-error type-body-sm">
            {t(failure)}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => close(false)}>
            {t('ui.cancel')}
          </Button>
          <Button type="submit" disabled={!formState.isValid} loading={formState.isSubmitting}>
            {t('config.account.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
