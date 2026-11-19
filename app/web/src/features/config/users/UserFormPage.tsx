import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { useActiveRanch, type Permission, type Role } from '../../../app/useActiveRanch';
import { useIsDesktop } from '../../../app/useIsDesktop';
import { Banner } from '../../../ui/Banner';
import { Button } from '../../../ui/Button';
import { Card } from '../../../ui/Card';
import { cx, focusRing } from '../../../ui/cx';
import { FormField } from '../../../ui/FormField';
import { iconArrowLeft } from '../../../ui/icons/glyphs';
import { Icon } from '../../../ui/icons/Icon';
import { PhoneField } from '../../../ui/PhoneField';
import { Select } from '../../../ui/Select';
import { Spinner } from '../../../ui/Spinner';
import { Tabs } from '../../../ui/Tabs';
import { TextField } from '../../../ui/TextField';
import { useSnackbar } from '../../../ui/useSnackbar';
import {
  errorCode,
  type InvitationCreated,
  type Member,
  type RolePreset,
  useCreateInvitation,
  useMembers,
  useRolePresets,
  useUpdateMember,
} from './api';
import { InviteLinkPanel } from './InviteLinkPanel';
import { PermissionsPanel } from './PermissionsPanel';
import { memberRoles, type MemberRole } from './permissions';
import { UpsellState } from './UpsellState';
import { fullName, USERS_PATH } from './names';
import { usePlanGate } from './usePlanGate';

const schema = z.object({
  firstName: z.string().trim().min(1, 'validation.required').max(100),
  lastName: z.string().trim().max(100),
  phone: z
    .string()
    .refine((v) => !v || (v.startsWith('+52') ? /^\+52\d{10}$/ : /^\+[1-9]\d{7,14}$/).test(v), {
      message: 'validation.phone',
    }),
  email: z.string().trim().min(1, 'validation.required').email('auth.validation.email').max(320),
});
type Values = z.infer<typeof schema>;

function presetOf(presets: RolePreset[] | undefined, role: Role): Set<Permission> {
  return new Set(presets?.find((p) => p.role === role)?.permissions ?? []);
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
      <BackLink />
      <Banner tone="error" title={t('users.loadError')}>
        <Button size="sm" variant="outline" onClick={onRetry}>
          {t('users.retry')}
        </Button>
      </Banner>
    </div>
  );
}

function BackLink() {
  const { t } = useTranslation();
  return (
    <Link
      to={USERS_PATH}
      className={cx('inline-flex items-center gap-1 text-primary type-label-md', focusRing)}
    >
      <Icon icon={iconArrowLeft} size={16} />
      {t('users.form.back')}
    </Link>
  );
}

/** The role picker and the toggles, shared by create and edit. */
function useRoleAndCodes(initialRole: MemberRole, initialCodes: Permission[] | null) {
  const { activeRanch } = useActiveRanch();
  const presets = useRolePresets();
  const mine = useMemo(() => new Set(activeRanch.permissions ?? []), [activeRanch.permissions]);
  const [role, setRole] = useState<MemberRole>(initialRole);
  const [codes, setCodes] = useState<Set<Permission> | null>(
    initialCodes ? new Set(initialCodes) : null,
  );
  // Nobody grants past the role (§7.8) or past what they hold themselves.
  const allowed = useMemo(() => {
    const preset = presetOf(presets.data, role);
    return new Set([...preset].filter((code) => mine.has(code)));
  }, [presets.data, role, mine]);
  const selected = useMemo(
    () => new Set([...(codes ?? allowed)].filter((code) => allowed.has(code))),
    [codes, allowed],
  );
  return {
    ready: presets.isSuccess,
    failed: presets.isError,
    retry: () => void presets.refetch(),
    role,
    // A new role starts again from its preset, as on the API.
    changeRole: (next: MemberRole) => {
      setRole(next);
      setCodes(null);
    },
    allowed,
    selected,
    toggle: (code: Permission, on: boolean) => {
      const next = new Set(selected);
      if (on) next.add(code);
      else next.delete(code);
      setCodes(next);
    },
  };
}

function RoleSelect({ value, onChange }: { value: MemberRole; onChange: (r: MemberRole) => void }) {
  const { t } = useTranslation();
  return (
    <Select
      label={t('users.form.role')}
      value={value}
      onChange={(v) => onChange(v as MemberRole)}
      options={memberRoles.map((role) => ({ value: role, label: t(`users.roles.${role}`) }))}
    />
  );
}

function Layout({
  title,
  general,
  permissions,
  footer,
  tab,
  onTabChange,
}: {
  title: string;
  general: React.ReactNode;
  permissions: React.ReactNode;
  footer: React.ReactNode;
  /** The mobile tab, controlled so a failed submit can bring the general data back. */
  tab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <BackLink />
      <h1 className="ramp-page-title text-primary">{title}</h1>
      {isDesktop ? (
        <div className="grid grid-cols-2 gap-6">
          <Card title={t('users.form.tabGeneral')}>{general}</Card>
          <Card title={t('users.form.tabPermissions')}>{permissions}</Card>
        </div>
      ) : (
        <Tabs
          label={title}
          type="solid"
          defaultValue="general"
          value={tab}
          onChange={onTabChange}
          items={[
            { value: 'general', label: t('users.form.tabGeneral'), content: general },
            { value: 'permissions', label: t('users.form.tabPermissions'), content: permissions },
          ]}
        />
      )}
      {footer}
    </div>
  );
}

/** Agregar Usuario: invite someone with a role and their permissions (E8 2573-149252, W 894-37699). */
export function NewUserPage() {
  const { t } = useTranslation();
  const { can } = useActiveRanch();
  const gate = usePlanGate();
  const create = useCreateInvitation();
  const picker = useRoleAndCodes('MEDICO', null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<InvitationCreated | null>(null);
  const [tab, setTab] = useState('general');
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', phone: '', email: '' },
  });

  if (!can('USERS_ADD')) return <Navigate403 />;
  if (gate.failed) return <LoadError onRetry={gate.retry} />;
  if (picker.failed) return <LoadError onRetry={picker.retry} />;
  if (gate.hasPro === undefined || !picker.ready)
    return (
      <div className="flex justify-center p-8">
        <Spinner size={32} />
      </div>
    );
  if (!gate.hasPro)
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
        <BackLink />
        <UpsellState />
      </div>
    );
  if (created) return <InviteLinkPanel invitation={created} />;

  // The general tab may be hidden on mobile: on a validation error, show it again.
  const submit = handleSubmit(
    (values) => {
      setError(null);
      create.mutate(
        {
          first_name: values.firstName,
          last_name: values.lastName || null,
          phone: values.phone || null,
          email: values.email,
          role: picker.role,
          permissions: [...picker.selected],
        },
        {
          onSuccess: setCreated,
          onError: (e) => {
            const code = errorCode(e);
            setError(t(`users.errors.${code}`, { defaultValue: t('users.errors.generic') }));
          },
        },
      );
    },
    () => setTab('general'),
  );
  const noPermission = picker.selected.size === 0;

  const general = (
    <form noValidate onSubmit={(e) => void submit(e)} className="grid gap-4 py-3">
      <FormField
        control={control}
        name="firstName"
        render={(field) => (
          <TextField {...field} autoComplete="off" label={`${t('users.form.firstName')} *`} />
        )}
      />
      <FormField
        control={control}
        name="lastName"
        render={(field) => (
          <TextField {...field} autoComplete="off" label={t('users.form.lastName')} />
        )}
      />
      <FormField
        control={control}
        name="phone"
        render={(field) => (
          <PhoneField {...field} label={t('users.form.phone')} placeholder="33-3456-7890" />
        )}
      />
      <FormField
        control={control}
        name="email"
        render={(field) => (
          <TextField
            {...field}
            type="email"
            autoComplete="off"
            label={`${t('users.form.email')} *`}
          />
        )}
      />
      <RoleSelect value={picker.role} onChange={picker.changeRole} />
    </form>
  );

  return (
    <Layout
      title={t('users.form.newTitle')}
      tab={tab}
      onTabChange={setTab}
      general={general}
      permissions={
        <div className="flex flex-col gap-2 py-3">
          <p className="text-secondary-text type-body-md">{t('users.form.permissionsIntro')}</p>
          <PermissionsPanel
            selected={picker.selected}
            allowed={picker.allowed}
            onChange={picker.toggle}
          />
        </div>
      }
      footer={
        <div className="flex flex-col items-stretch gap-2 lg:items-end">
          {error && <Banner tone="error">{error}</Banner>}
          {noPermission && (
            <p className="text-error type-body-sm" role="status">
              {t('users.form.needPermission')}
            </p>
          )}
          <Button onClick={() => void submit()} disabled={noPermission} loading={create.isPending}>
            {t('users.form.create')}
          </Button>
        </div>
      }
    />
  );
}

function Navigate403() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
      <BackLink />
      <Banner tone="error">{t('users.errors.permission_denied')}</Banner>
    </div>
  );
}

function EditForm({ member }: { member: Member }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const update = useUpdateMember();
  const role = member.role as MemberRole;
  const picker = useRoleAndCodes(role, member.permissions);
  const [error, setError] = useState<string | null>(null);
  const name = fullName(member);

  if (picker.failed) return <LoadError onRetry={picker.retry} />;
  if (!picker.ready)
    return (
      <div className="flex justify-center p-8">
        <Spinner size={32} />
      </div>
    );
  const noPermission = picker.selected.size === 0;
  const save = () => {
    setError(null);
    update.mutate(
      {
        userId: member.user_id,
        body: { role: picker.role, permissions: [...picker.selected] },
      },
      {
        onSuccess: () => {
          snackbar.show({ message: t('users.form.saved', { name }) });
          navigate(USERS_PATH);
        },
        onError: (e) => {
          const code = errorCode(e);
          setError(t(`users.errors.${code}`, { defaultValue: t('users.errors.generic') }));
        },
      },
    );
  };

  return (
    <Layout
      title={t('users.form.editTitle', { name })}
      general={
        <div className="grid gap-4 py-3">
          <dl className="grid gap-2">
            <dt className="text-secondary-text type-body-sm">{t('users.columns.name')}</dt>
            <dd className="text-primary-text type-body-md">{name}</dd>
            <dt className="text-secondary-text type-body-sm">{t('users.form.email')}</dt>
            <dd className="text-primary-text type-body-md">{member.email}</dd>
          </dl>
          <RoleSelect value={picker.role} onChange={picker.changeRole} />
        </div>
      }
      permissions={
        <div className="py-3">
          <PermissionsPanel
            selected={picker.selected}
            allowed={picker.allowed}
            onChange={picker.toggle}
          />
        </div>
      }
      footer={
        <div className="flex flex-col items-stretch gap-2 lg:items-end">
          {error && <Banner tone="error">{error}</Banner>}
          {noPermission && (
            <p className="text-error type-body-sm" role="status">
              {t('users.form.needPermission')}
            </p>
          )}
          <Button onClick={save} disabled={noPermission} loading={update.isPending}>
            {t('users.form.save')}
          </Button>
        </div>
      }
    />
  );
}

/** Editar usuario: role and permissions; the next request already uses them. */
export function EditUserPage() {
  const { t } = useTranslation();
  const { can } = useActiveRanch();
  const { userId } = useParams();
  const members = useMembers();
  if (!can('USERS_EDIT')) return <Navigate403 />;
  if (members.isError) return <LoadError onRetry={() => void members.refetch()} />;
  if (members.isPending)
    return (
      <div className="flex justify-center p-8">
        <Spinner size={32} />
      </div>
    );
  const member = members.data?.find((m) => m.user_id === userId);
  if (!member || member.is_owner || !memberRoles.includes(member.role as MemberRole))
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
        <BackLink />
        <Banner tone="warning">{t('users.form.notFound')}</Banner>
      </div>
    );
  return <EditForm key={member.user_id} member={member} />;
}
