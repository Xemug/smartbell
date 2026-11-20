import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
  'already_member',
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
  const { state, retry, signOut, sendVerificationEmail, refreshIdentity } = useAuth();
  const [verification, setVerification] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  // Kept apart from accept.error, which clears while a retry is in flight and would flicker.
  const [unverified, setUnverified] = useState(false);
  const preview = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => previewInvitation(token),
    retry: false,
  });
  const accept = useMutation({
    mutationFn: () => acceptInvitation(token),
    // These won't change on a retry, so the sign-in must stop sending them back here.
    onError: (error) => {
      setUnverified(errorCode(error) === 'email_unverified');
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
  const signedIn = state.status === 'signedIn';
  const open = preview.data?.status === 'pending';
  useEffect(() => {
    // Remembered only to bring a signed-out invitee back after signing up or in; once they are
    // here signed in it has done its job, so a later sign-in in this tab goes where it normally would.
    if (signedOut && open) rememberInvitation(token);
    if (signedIn) forgetInvitation();
  }, [signedOut, signedIn, open, token]);

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
            {errorText(
              inv.status === 'accepted'
                ? 'invitation_used'
                : inv.status === 'revoked'
                  ? 'invitation_revoked'
                  : 'invitation_expired',
            )}
          </Banner>
        )}
        {!closed && state.status === 'sessionError' && (
          <>
            <Banner tone="error">{t('users.invite.sessionError')}</Banner>
            <Button fullWidth size="lg" onClick={retry}>
              {t('users.invite.retry')}
            </Button>
          </>
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
        {!closed && signedIn && (
          <>
            <p className="text-center text-secondary-text type-body-md">
              {t('users.invite.signedInAs', { email: state.account.user.email })}
            </p>
            {unverified ? (
              <>
                <Banner tone="info">
                  {t('users.invite.verify.body', { email: state.account.user.email })}
                </Banner>
                {verification === 'sent' && (
                  <p role="status" className="text-center text-secondary-text type-body-md">
                    {t('users.invite.verify.sent')}
                  </p>
                )}
                {verification === 'failed' && (
                  <Banner tone="error">{t('users.invite.verify.failed')}</Banner>
                )}
                <Button
                  fullWidth
                  size="lg"
                  variant="outline"
                  loading={verification === 'sending'}
                  onClick={() => {
                    setVerification('sending');
                    sendVerificationEmail().then(
                      () => setVerification('sent'),
                      () => setVerification('failed'),
                    );
                  }}
                >
                  {t('users.invite.verify.send')}
                </Button>
                <Button
                  fullWidth
                  size="lg"
                  loading={accept.isPending}
                  onClick={() => {
                    // The confirmed email reaches the API only in a fresh token.
                    refreshIdentity().then(
                      () => accept.mutate(),
                      () => accept.mutate(),
                    );
                  }}
                >
                  {t('users.invite.verify.done')}
                </Button>
              </>
            ) : (
              <>
                {accept.isError && (
                  <Banner tone="error">{errorText(errorCode(accept.error))}</Banner>
                )}
                <Button
                  fullWidth
                  size="lg"
                  loading={accept.isPending}
                  onClick={() => accept.mutate()}
                >
                  {t('users.invite.accept')}
                </Button>
              </>
            )}
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
