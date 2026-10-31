import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { cx } from './cx';
import { RadioGroup } from './RadioGroup';
import { Select } from './Select';

export interface FilterCategory {
  label: string;
  variables: readonly { value: string; label: string }[];
  /** Preselected when the category is picked. Must be one of `variables`. */
  defaultVariable: string;
}

export type FilterCategories = Record<string, FilterCategory>;

/**
 * The filter a set of categories can produce. Declared `as const satisfies FilterCategories`, each
 * category narrows to its own variables, so `{ category: 'raza', variable: 'vacia' }` won't compile.
 */
export type FilterOf<T extends FilterCategories> = {
  [C in keyof T & string]: { category: C; variable: T[C]['variables'][number]['value'] };
}[keyof T & string];

type FilterPanelProps<T extends FilterCategories> = {
  categories: T;
  /** The filter in force; `null` for none. */
  value: FilterOf<T> | null;
  onApply: (filter: FilterOf<T> | null) => void;
  className?: string;
} & (
  | { variant?: 'inline'; open?: never; onOpenChange?: never }
  /** The mobile filter sheet; the caller opens it from its filter button. */
  | { variant: 'sheet'; open: boolean; onOpenChange: (open: boolean) => void }
);

// Two levels, Categoría → Variable. Picking a category preselects its default, and nothing reaches
// the list until "Aplicar filtro".
export function FilterPanel<T extends FilterCategories>({
  categories,
  value,
  onApply,
  className,
  ...mode
}: FilterPanelProps<T>) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<FilterOf<T> | null>(value);
  // By content: a parent that rebuilds an equal object must not wipe the unapplied choice.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setDraft(value), [value?.category, value?.variable]);

  const category = draft ? categories[draft.category] : undefined;
  const categoryOptions = Object.entries(categories).map(([key, { label }]) => ({
    value: key,
    label,
  }));
  const variableOptions = category ? [...category.variables] : [];

  const pickCategory = (key: string) => {
    const picked = categories[key];
    if (picked) setDraft({ category: key, variable: picked.defaultVariable } as FilterOf<T>);
  };
  const pickVariable = (variable: string) => {
    if (draft) setDraft({ ...draft, variable });
  };

  const changed =
    draft !== null && (draft.category !== value?.category || draft.variable !== value?.variable);
  const closeSheet = () => {
    if (mode.variant === 'sheet') mode.onOpenChange(false);
  };
  const apply = (filter: FilterOf<T> | null) => {
    onApply(filter);
    closeSheet();
  };

  const actions = (
    <>
      {value && (
        <Button
          variant="ghost"
          onClick={() => {
            setDraft(null);
            apply(null);
          }}
        >
          {t('ui.noFilter')}
        </Button>
      )}
      <Button disabled={!changed} onClick={() => apply(draft)}>
        {t('ui.applyFilter')}
      </Button>
    </>
  );

  if (mode.variant === 'sheet') {
    return (
      <BottomSheet
        open={mode.open}
        onOpenChange={(open) => {
          // Closing without applying forgets the unapplied choice.
          if (!open) setDraft(value);
          mode.onOpenChange(open);
        }}
        title={t('ui.filtersTitle')}
        footer={actions}
        className={className}
      >
        <RadioGroup
          label={t('ui.filterCategory')}
          options={categoryOptions}
          value={draft?.category ?? ''}
          onChange={pickCategory}
        />
        {category && (
          <RadioGroup
            label={t('ui.filterVariableStep')}
            options={variableOptions}
            value={draft?.variable ?? ''}
            onChange={pickVariable}
          />
        )}
      </BottomSheet>
    );
  }

  return (
    <div
      role="group"
      aria-label={t('ui.filtersTitle')}
      className={cx('flex flex-col gap-2', className)}
    >
      <p className="type-label-sm text-primary">{t('ui.filtersTitle')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label={t('ui.filterCategory')}
          placeholder={t('ui.filterCategory')}
          options={categoryOptions}
          value={draft?.category ?? ''}
          onChange={pickCategory}
          className="w-full sm:w-48"
        />
        <Select
          aria-label={t('ui.filterVariable')}
          placeholder={t('ui.filterVariable')}
          options={variableOptions}
          value={draft?.variable ?? ''}
          onChange={pickVariable}
          disabled={!category}
          className="w-full sm:w-64"
        />
        {actions}
      </div>
    </div>
  );
}
