import { zodResolver } from '@hookform/resolvers/zod';
import { format, startOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { SupportConfig } from '../../app/support';
import { whatsappUrl } from '../../app/whatsapp';
import { Banner } from '../../ui/Banner';
import { Button } from '../../ui/Button';
import { buttonClass } from '../../ui/buttonStyles';
import { Card } from '../../ui/Card';
import { cx } from '../../ui/cx';
import { DataTable, type DataTableColumn } from '../../ui/DataTable';
import { DateField } from '../../ui/DateField';
import { fromIso, toIso } from '../../ui/dates';
import { EmptyState } from '../../ui/EmptyState';
import { FormField } from '../../ui/FormField';
import { iconSend } from '../../ui/icons/glyphs';
import { Icon } from '../../ui/icons/Icon';
import { Spinner } from '../../ui/Spinner';
import { TextArea } from '../../ui/TextArea';
import { TextField } from '../../ui/TextField';
import { useSnackbar } from '../../ui/useSnackbar';
import {
  SaveError,
  useFakeDoorReport,
  useSaveSupportConfig,
  useSupportConfig,
  type FakeDoorCount,
  type SupportConfigIn,
} from './api';

const FEATURE_PLACEHOLDER = '{nombre}';
const MAX = 500;
/** What the founder may type around the digits: "+52 1 33 1234-5678" is the same number. */
const numberDecoration = /[\s()+-]/g;

const digitsOf = (number: string) => number.replace(numberDecoration, '');

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

// The same rules as the API's SupportConfigIn, so a refusal shows on the field before the save.
const message = z.string().trim().max(MAX, 'admin.support.errors.tooLong');
const schema = z.object({
  whatsapp_number: z
    .string()
    .refine((v) => /^[1-9]\d{7,14}$/.test(digitsOf(v)), 'admin.support.errors.number'),
  support_message: message,
  payment_message: message,
  feature_message: message.refine(
    (v) => !v || v.includes(FEATURE_PLACEHOLDER),
    'admin.support.errors.placeholder',
  ),
  community_url: z
    .string()
    .trim()
    .max(MAX, 'admin.support.errors.tooLong')
    .refine((v) => !v || isHttpsUrl(v), 'admin.support.errors.url'),
});
type Values = z.infer<typeof schema>;

function valuesOf(config: SupportConfig): Values {
  return {
    whatsapp_number: config.whatsapp_number,
    support_message: config.support_message ?? '',
    payment_message: config.payment_message ?? '',
    feature_message: config.feature_message ?? '',
    community_url: config.community_url ?? '',
  };
}

/** An empty message goes back to the app's default copy, which the API stores as null. */
function bodyOf(values: Values): SupportConfigIn {
  return {
    whatsapp_number: digitsOf(values.whatsapp_number),
    support_message: values.support_message || null,
    payment_message: values.payment_message || null,
    feature_message: values.feature_message || null,
    community_url: values.community_url || null,
  };
}

function SupportForm({ config }: { config: SupportConfig }) {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const save = useSaveSupportConfig();
  const { control, handleSubmit, reset, setError } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: valuesOf(config),
  });

  const submit = handleSubmit((values) =>
    save.mutate(bodyOf(values), {
      onSuccess: (saved) => {
        reset(valuesOf(saved));
        snackbar.show({ kind: 'success', message: t('admin.support.saved') });
      },
      onError: (error) => {
        const fields = error instanceof SaveError ? error.fields : [];
        for (const field of fields) setError(field, { message: 'admin.support.errors.refused' });
        if (!fields.length) snackbar.show({ kind: 'error', message: t('admin.support.saveError') });
      },
    }),
  );

  // The saved number and message, not the draft: this checks what users get right now.
  const preview = whatsappUrl(
    config.support_message || t('shell.supportPrefill'),
    config.whatsapp_number,
  );
  const defaultHint = t('admin.support.defaultHint');

  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="grid gap-4">
      <FormField
        control={control}
        name="whatsapp_number"
        render={(field) => (
          <TextField
            {...field}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            label={`${t('admin.support.number')} *`}
            hint={t('admin.support.numberHint')}
          />
        )}
      />
      <FormField
        control={control}
        name="support_message"
        render={(field) => (
          <TextArea
            {...field}
            rows={3}
            label={t('admin.support.supportMessage')}
            placeholder={t('shell.supportPrefill')}
            hint={defaultHint}
          />
        )}
      />
      <FormField
        control={control}
        name="payment_message"
        render={(field) => (
          <TextArea
            {...field}
            rows={3}
            label={t('admin.support.paymentMessage')}
            placeholder={t('support.paymentPrefill')}
            hint={defaultHint}
          />
        )}
      />
      <FormField
        control={control}
        name="feature_message"
        render={(field) => (
          <TextArea
            {...field}
            rows={3}
            label={t('admin.support.featureMessage')}
            placeholder={t('fakeDoor.prefill', { nombre: FEATURE_PLACEHOLDER })}
            hint={t('admin.support.featureHint', { placeholder: FEATURE_PLACEHOLDER })}
          />
        )}
      />
      <FormField
        control={control}
        name="community_url"
        render={(field) => (
          <TextField
            {...field}
            autoComplete="off"
            inputMode="url"
            label={t('admin.support.communityUrl')}
            placeholder="https://chat.whatsapp.com/…"
            hint={t('admin.support.communityHint')}
          />
        )}
      />
      <div className="flex flex-wrap items-center justify-end gap-3">
        <a
          href={preview}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(buttonClass('outline'), 'h-control-md gap-2 px-4 type-label-md')}
        >
          <Icon icon={iconSend} size={20} />
          {t('admin.support.tryIt')}
        </a>
        <Button type="submit" loading={save.isPending}>
          {t('admin.support.save')}
        </Button>
      </div>
    </form>
  );
}

function SoporteCard() {
  const { t } = useTranslation();
  const config = useSupportConfig();
  return (
    <Card title={t('admin.support.title')}>
      {config.isError ? (
        <Banner tone="error" title={t('admin.loadError')}>
          <Button size="sm" variant="outline" onClick={() => void config.refetch()}>
            {t('admin.retry')}
          </Button>
        </Banner>
      ) : config.data ? (
        <SupportForm config={config.data} />
      ) : (
        <div className="flex justify-center p-8">
          <Spinner size={32} />
        </div>
      )}
    </Card>
  );
}

/** The start of `day` where the founder is, as the instant the API filters from. */
const sinceOf = (day: string) => startOfDay(fromIso(day)).toISOString();

function DemandaCard() {
  const { t } = useTranslation();
  const [day, setDay] = useState(() => toIso(subDays(new Date(), 30)));
  // Half-typed, the field reports no date; the table keeps the last full one meanwhile.
  const [since, setSince] = useState(day);
  const report = useFakeDoorReport(sinceOf(since));
  const rows = report.data?.features ?? [];
  const tapped = rows.some((row) => row.taps > 0);

  const columns: DataTableColumn<FakeDoorCount>[] = [
    {
      key: 'feature',
      header: t('admin.demand.feature'),
      sortValue: (row) => t(`nav.${row.feature.toLowerCase()}`),
    },
    { key: 'taps', header: t('admin.demand.taps'), sortValue: (row) => row.taps, align: 'right' },
    {
      key: 'users',
      header: t('admin.demand.users'),
      sortValue: (row) => row.users,
      align: 'right',
    },
    {
      key: 'last',
      header: t('admin.demand.lastTap'),
      sortValue: (row) => row.last_tapped_at ?? '',
      cell: (row) =>
        row.last_tapped_at
          ? format(new Date(row.last_tapped_at), 'dd/MM/yyyy HH:mm', { locale: es })
          : '—',
    },
  ];

  return (
    <Card title={t('admin.demand.title')}>
      <div className="grid gap-4">
        <DateField
          label={t('admin.demand.since')}
          value={day}
          onChange={(next) => {
            setDay(next);
            if (next) setSince(next);
          }}
          maxDate="today"
          className="max-w-xs"
        />
        {report.isError ? (
          <Banner tone="error" title={t('admin.loadError')}>
            <Button size="sm" variant="outline" onClick={() => void report.refetch()}>
              {t('admin.retry')}
            </Button>
          </Banner>
        ) : report.isPending ? (
          <div className="flex justify-center p-8">
            <Spinner size={32} />
          </div>
        ) : tapped ? (
          <DataTable
            label={t('admin.demand.title')}
            columns={columns}
            rows={rows}
            getRowId={(row) => row.feature}
            loading={report.isFetching}
          />
        ) : (
          <EmptyState
            title={t('admin.demand.emptyTitle')}
            description={t('admin.demand.emptyBody')}
          />
        )}
      </div>
    </Card>
  );
}

/** Soporte y demanda: the WhatsApp support copy and fake-door demand, for Smartbell staff. */
export function SupportAdminPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <h1 className="ramp-page-title text-primary">{t('admin.title')}</h1>
      <SoporteCard />
      <DemandaCard />
    </div>
  );
}
