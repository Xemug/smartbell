import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { whatsappUrl } from '../../../app/whatsapp';
import { Button } from '../../../ui/Button';
import { buttonClass } from '../../../ui/buttonStyles';
import { cx } from '../../../ui/cx';
import { EmptyState } from '../../../ui/EmptyState';
import { iconShare } from '../../../ui/icons/glyphs';
import { Icon } from '../../../ui/icons/Icon';
import { TextField } from '../../../ui/TextField';
import { useSnackbar } from '../../../ui/useSnackbar';
import type { InvitationCreated } from './api';
import { invitationPath } from './invitationLink';
import { fullName, USERS_PATH } from './names';

/**
 * The invite link, shown once right after creating it: only its hash is stored, so it can't be
 * shown again. There is no email sender yet, so the inviter shares it (copy or WhatsApp).
 */
export function InviteLinkPanel({ invitation }: { invitation: InvitationCreated }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const link = `${window.location.origin}${invitationPath(invitation.token)}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      snackbar.show({ message: t('users.link.copied') });
    } catch {
      // No clipboard permission: the link stays selectable in the field.
    }
  };
  // No number: WhatsApp lets the inviter pick the contact.
  const share = whatsappUrl(t('users.link.whatsappText', { link }), '');
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
      <EmptyState
        illustration="cow-dancing"
        title={t('users.link.title')}
        description={t('users.link.body', { name: fullName(invitation), email: invitation.email })}
      />
      <TextField
        label={t('users.link.copy')}
        value={link}
        readOnly
        onFocus={(e) => e.target.select()}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => void copy()}>
          {t('users.link.copy')}
        </Button>
        <a
          href={share}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(buttonClass('outline'), 'h-control-md gap-2 px-4 type-label-md')}
        >
          <Icon icon={iconShare} size={20} />
          {t('users.link.whatsapp')}
        </a>
        <Button onClick={() => navigate(USERS_PATH)}>{t('users.link.done')}</Button>
      </div>
    </div>
  );
}
