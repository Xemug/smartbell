import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable, PAGE_SIZE, type DataTableColumn } from '../../ui/DataTable';
import { SplitIndicator } from '../../ui/SplitIndicator';
import { TextField } from '../../ui/TextField';
import { useAnimalPage, type Animal } from '../animals/list/api';
import { useGroupList } from './api';
import { groupName } from './labels';

const SEARCH_DELAY_MS = 300;

interface CowPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Pick bulls on the ranch (EN_RANCHO or AMBOS) for a bull group instead of cows. */
  bulls?: boolean;
}

/**
 * The manual pick (164:629, 2005-2848): the ranch's cows, searchable and paged on the server, with
 * checkboxes that survive paging and a running "Vacas en potrero" count. The designs also drag rows
 * across on the web; checkboxes do the same job on every screen and with a keyboard.
 */
export function CowPicker({ selected, onChange, bulls = false }: CowPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const query = {
    ...(bulls ? { kind: 'TORO' as const, on_ranch: true } : { kind: 'VACA' as const }),
    page,
    page_size: PAGE_SIZE,
    ...(q ? { q } : {}),
  };
  const cows = useAnimalPage(query);
  const groups = useGroupList();
  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of groups.data ?? []) map.set(g.id, groupName(g, t));
    return map;
  }, [groups.data, t]);
  const general = groups.data?.find((g) => g.preset === 'GENERAL');
  // A cow with no group is in General; a bull with none is in no group.
  const noGroup = bulls
    ? t('groups.bulls.noGroup')
    : general
      ? groupName(general, t)
      : t('groups.presets.GENERAL');

  const columns: DataTableColumn<Animal>[] = [
    {
      key: 'id',
      header: t(`animals.columns.id.${bulls ? 'toros' : 'vacas'}`),
      cell: (a) => a.control_id,
    },
    {
      key: 'grupo',
      header: t('animals.columns.grupo'),
      cell: (a) => (a.group_id ? (names.get(a.group_id) ?? '—') : noGroup),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-primary type-body-md">
        {t(bulls ? 'groups.bulls.pickHelp' : 'groups.wizard.pickHelp')}
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <TextField
          type="search"
          aria-label={t('groups.wizard.search')}
          placeholder={t('groups.wizard.search')}
          value={search}
          maxLength={60}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full min-w-0 sm:w-auto sm:flex-1 lg:max-w-72"
        />
        <SplitIndicator
          label={t(bulls ? 'groups.bullsIn' : 'groups.wizard.inGroup')}
          count={selected.length}
        />
      </div>
      <DataTable
        label={t('groups.wizard.filtered')}
        columns={columns}
        rows={cows.data?.items ?? []}
        getRowId={(a) => a.id}
        getRowLabel={(a) => a.control_id}
        selected={selected}
        onSelectionChange={onChange}
        total={cows.data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        loading={cows.isFetching && !cows.data}
        empty={
          <p className="text-center text-secondary-text">
            {t(bulls ? 'groups.bulls.noBulls' : 'groups.wizard.noCows')}
          </p>
        }
      />
    </div>
  );
}
