import { useTranslation } from 'react-i18next';

import { cx, focusRing } from './cx';
import { iconChevronLeft, iconChevronRight, type Glyph } from './icons/glyphs';
import { Icon } from './icons/Icon';
import { pageItems } from './pageItems';

interface PaginationProps {
  /** Current page, counted from 1. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Names the pager when a page has more than one. */
  label?: string;
  className?: string;
}

const cell =
  'flex size-9 shrink-0 items-center justify-center rounded-moon-i-xs type-label-md md:size-10';

function Arrow({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: Glyph;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        cell,
        focusRing,
        'text-primary hover:bg-primary-10 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-secondary-text',
      )}
    >
      <Icon icon={icon} size={20} />
    </button>
  );
}

export function Pagination({ page, pageCount, onPageChange, label, className }: PaginationProps) {
  const { t } = useTranslation();
  return (
    <nav aria-label={label ?? t('ui.pagination')} className={cx('flex items-center', className)}>
      <Arrow
        icon={iconChevronLeft}
        label={t('ui.previousPage')}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      />
      {pageItems(page, pageCount).map((item, index) =>
        item === null ? (
          <span key={`gap-${index}`} aria-hidden className={cx(cell, 'text-secondary-text')}>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={t('ui.goToPage', { page: item })}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPageChange(item)}
            className={cx(
              cell,
              focusRing,
              item === page
                ? 'bg-primary text-button-text'
                : 'text-primary-text hover:bg-primary-10',
            )}
          >
            {item}
          </button>
        ),
      )}
      <Arrow
        icon={iconChevronRight}
        label={t('ui.nextPage')}
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      />
    </nav>
  );
}
