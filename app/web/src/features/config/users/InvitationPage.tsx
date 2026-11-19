import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { activeRanchKey } from '../../../app/useActiveRanch';
import { AuthLayout } from '../../auth/AuthLayout';
import { useAuth } from '../../auth/useAuth';
import { Banner } from '../../../ui/Banner';
import { Button } from '../../../ui/Button';
import { buttonClass } from '../../../ui/buttonStyles';
import { cx } from '../../../ui/cx';
import { Spinner } from '../../../ui/Spinner';
import { acceptInvitation, errorCode, previewInvitation } from './api';
import { forgetInvitation, rememberInvitation } from './invitationLink';

const terminalErrors = new Set([
  'email_mismatch',
  'invitation_used',
  'invitation_expired',
  'invitation_revoked',
  'invitation_not_found',
  'plan_required',
]);

const linkButton = (variant: 'fill' | 'outline') =>
  cx(buttonClass(variant), 'h-control-lg w-full gap-2 px-5 type-label-lg');

/** The invite link: who invites you where, then sign up or in and accept. Public. */
export function InvitationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token = '' } = useParams();
  const { state, retry, signOut } = useAuth();
  const preview = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => previewInvitation(token),
    retry: false,
  });
  const accept = useMutation({
    mutationFn: () => acceptInvitation(token),
    // These won't change on a retry, so the sign-in must stop sending them back here.
    onError: (error) => {
      if (terminalErrors.has(errorCode(error))) forgetInvitation();
    },
    onSuccess: (ranchId) => {
      if (state.status === 'signedIn') {
        try {
          // Open the ranch they just joined, not their own "Mi rancho".
          localStorage.setItem(activeRanchKey(state.account.user.id), ranchId);
        } catch {
          // They can switch to it from the ranch menu.
        }
      }
      forgetInvitation();
      navigate('/', { replace: true });
      retry(); // Reloads the account, which now lists the new ranch.
    },
  });
  const signedOut = state.status === 'signedOut';
  useEffect(() => {
    if (signedOut) rememberInvitation(token);
  }, [signedOut, token]);

  const errorText = (code: string) =>
    t(`users.invite.errors.${code}`, {
      email: preview.data?.email,
      defaultValue: t('users.invite.errors.generic'),
    });

  let body;
  if (preview.isPending || state.status === 'loading') {
    body = (
      <div className="flex flex-col items-center gap-2 p-8" role="status">
        <Spinner size={32} />
        <span className="sr-only">{t('users.invite.loading')}</span>
      </div>
    );
  } else if (preview.isError) {
    body = (
      <>
        <Banner tone="error">{errorText(errorCode(preview.error))}</Banner>
        <Link to="/" className={linkButton('outline')} onClick={forgetInvitation}>
          {t('users.invite.goHome')}
        </Link>
      </>
    );
  } else {
    const inv = preview.data;
    const role = t(`users.roles.${inv.role}`);
    const closed = inv.status !== 'pending';
    body = (
      <>
        <h2 className="text-center text-primary type-heading-sm">{t('users.invite.title')}</h2>
        <p className="text-center text-primary-text type-body-md">
          {inv.invited_by
            ? t('users.invite.body', { inviter: inv.invited_by, ranch: inv.ranch_name, role })
            : t('users.invite.bodyNoInviter', { ranch: inv.ranch_name, role })}
        </p>
        {closed && (
          <Banner tone="warning">
            {errorText(inv.status === 'accepted' ? 'invitation_used' : 'invitation_expired')}
          </Banner>
        )}
        {!closed && signedOut && (
          <>
            <p className="text-center text-secondary-text type-body-md">
              {t('users.invite.emailHint', { email: inv.email })}
            </p>
            <Link to="/registro" className={linkButton('fill')}>
              {t('users.invite.signUp')}
            </Link>
            <Link to="/entrar" className={linkButton('outline')}>
              {t('users.invite.signIn')}
            </Link>
          </>
        )}
        {!closed && state.status === 'signedIn' && (
          <>
            <p className="text-center text-secondary-text type-body-md">
              {t('users.invite.signedInAs', { email: state.account.user.email })}
            </p>
            {accept.isError && <Banner tone="error">{errorText(errorCode(accept.error))}</Banner>}
            <Button fullWidth size="lg" loading={accept.isPending} onClick={() => accept.mutate()}>
              {t('users.invite.accept')}
            </Button>
            <Button
              fullWidth
              variant="ghost"
              onClick={() => {
                rememberInvitation(token);
                void signOut();
              }}
            >
              {t('users.invite.switchAccount')}
            </Button>
          </>
        )}
        {closed && (
          <Link to="/" className={linkButton('outline')} onClick={forgetInvitation}>
            {t('users.invite.goHome')}
          </Link>
        )}
      </>
    );
  }
  return <AuthLayout title={t('users.invite.title')}>{body}</AuthLayout>;
}
