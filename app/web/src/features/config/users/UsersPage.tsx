import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useActiveRanch } from '../../../app/useActiveRanch';
import { Banner } from '../../../ui/Banner';
import { Button } from '../../../ui/Button';
import { Card } from '../../../ui/Card';
import { ConfirmDialog } from '../../../ui/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../../ui/DataTable';
import { IconButton } from '../../../ui/IconButton';
import { iconPencil, iconPlus, iconTrash, iconX } from '../../../ui/icons/glyphs';
import { Spinner } from '../../../ui/Spinner';
import { useSnackbar } from '../../../ui/useSnackbar';
import { useOptionalAuth } from '../../auth/useAuth';
import {
  errorCode,
  type Invitation,
  type Member,
  useInvitations,
  useMembers,
  useRemoveMember,
  useRevokeInvitation,
} from './api';
import { fullName, USERS_PATH } from './names';
import { UpsellState } from './UpsellState';
import { usePlanGate } from './usePlanGate';

function shortDate(iso: string) {
  return format(new Date(iso), 'dd/MM/yyyy', { locale: es });
}

/** Administrar usuarios: the active ranch's members and pending invitations (E8, web 1.17). */
export function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = useActiveRanch();
  const auth = useOptionalAuth();
  const myId = auth?.state.status === 'signedIn' ? auth.state.account.user.id : null;
  const snackbar = useSnackbar();
  const members = useMembers();
  const invitations = useInvitations(can('USERS_VIEW'));
  const gate = usePlanGate();
  const remove = useRemoveMember();
  const revoke = useRevokeInvitation();
  const [toDelete, setToDelete] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deleteFrom = useRef<HTMLElement | null>(null);

  const editable = (m: Member) => !m.is_owner && m.user_id !== myId;
  const errorText = (code: string) =>
    t(`users.errors.${code}`, { defaultValue: t('users.errors.generic') });

  const confirmDelete = () => {
    if (!toDelete) return;
    const name = fullName(toDelete);
    remove.mutate(toDelete.user_id, {
      onSuccess: () => {
        setToDelete(null);
        snackbar.show({ kind: 'deleted', message: t('users.deleted', { name }) });
      },
      onError: (e) => {
        setToDelete(null);
        setError(errorText(errorCode(e)));
      },
    });
  };

  const columns: DataTableColumn<Member>[] = [
    {
      key: 'name',
      header: t('users.columns.name'),
      sortValue: (m) => fullName(m).toLowerCase(),
      cell: (m) => (
        <span className="flex flex-col">
          <span className="text-primary-text type-body-md">{fullName(m)}</span>
          <span className="text-secondary-text type-body-sm">
            {m.user_id === myId ? `${t('users.you')} · ${m.email}` : m.email}
          </span>
        </span>
      ),
    },
    {
      key: 'role',
      header: t('users.columns.role'),
      sortValue: (m) => t(`users.roles.${m.role}`),
      cell: (m) => (m.is_owner ? t('users.owner') : t(`users.roles.${m.role}`)),
    },
    {
      key: 'lastActive',
      header: t('users.columns.lastActive'),
      hideOnMobile: true,
      sortValue: (m) => m.last_active_at ?? '',
      cell: (m) => (m.last_active_at ? shortDate(m.last_active_at) : t('users.columns.never')),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (m) =>
        editable(m) ? (
          <span className="flex justify-end gap-1">
            {can('USERS_EDIT') && (
              <IconButton
                icon={iconPencil}
                variant="ghost"
                size="sm"
                label={t('users.edit', { name: fullName(m) })}
                onClick={() => navigate(`${USERS_PATH}/${m.user_id}`)}
              />
            )}
            {can('USERS_DELETE') && (
              <IconButton
                icon={iconTrash}
                variant="ghost"
                size="sm"
                label={t('users.delete', { name: fullName(m) })}
                onClick={(event) => {
                  deleteFrom.current = event.currentTarget;
                  setToDelete(m);
                }}
              />
            )}
          </span>
        ) : null,
    },
  ];

  const pending: Invitation[] = invitations.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="ramp-page-title text-primary">{t('users.title')}</h1>
          {members.data && (
            <p className="text-secondary-text type-body-md">
              {t('users.count', { count: members.data.length })}
            </p>
          )}
        </div>
        {can('USERS_ADD') && gate.hasPro && (
          <Button leadingIcon={iconPlus} onClick={() => navigate(`${USERS_PATH}/nuevo`)}>
            {t('users.add')}
          </Button>
        )}
      </header>

      {can('USERS_ADD') && gate.hasPro === false && <UpsellState compact />}

      {error && (
        <Banner tone="error" onClose={() => setError(null)}>
          {error}
        </Banner>
      )}

      {members.isPending && (
        <div className="flex justify-center p-8">
          <Spinner size={32} />
        </div>
      )}
      {members.isError && (
        <Banner tone="error" title={t('users.loadError')}>
          <Button size="sm" variant="outline" onClick={() => void members.refetch()}>
            {t('users.retry')}
          </Button>
        </Banner>
      )}
      {members.data && (
        <DataTable
          label={t('users.title')}
          columns={columns}
          rows={members.data}
          getRowId={(m) => m.user_id}
          getRowLabel={fullName}
          keepPage
        />
      )}

      {pending.length > 0 && (
        <Card title={t('users.pending.title')}>
          <ul className="flex flex-col divide-y divide-alternate">
            {pending.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-2">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-primary-text type-body-md">
                    {fullName(inv)} · {t(`users.roles.${inv.role}`)}
                  </span>
                  <span className="truncate text-secondary-text type-body-sm">
                    {inv.email} · {t('users.pending.expires', { date: shortDate(inv.expires_at) })}
                  </span>
                </span>
                {can('USERS_ADD') && (
                  <IconButton
                    icon={iconX}
                    variant="ghost"
                    size="sm"
                    label={t('users.pending.revoke', { email: inv.email })}
                    loading={revoke.isPending && revoke.variables === inv.id}
                    onClick={() =>
                      revoke.mutate(inv.id, {
                        onSuccess: () => snackbar.show({ message: t('users.pending.revoked') }),
                        onError: (e) => setError(errorText(errorCode(e))),
                      })
                    }
                  />
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title={t('users.deleteTitle', { name: toDelete ? fullName(toDelete) : '' })}
        description={t('users.deleteBody')}
        confirmLabel={t('users.deleteConfirm')}
        onConfirm={confirmDelete}
        danger
        loading={remove.isPending}
        returnFocus={deleteFrom}
      />
    </div>
  );
}
