import { format, parseISO } from 'date-fns';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '../../../ui/Button';
import { cx, focusRing } from '../../../ui/cx';
import {
  iconAnimalReproduction,
  iconClipboard,
  iconCow,
  iconDiet,
  iconHealth,
  iconPlus,
  iconTrash,
  iconUsers,
  type Glyph,
} from '../../../ui/icons/glyphs';
import { Icon } from '../../../ui/icons/Icon';
import { launcherGroups, type LauncherGroup } from '../../events/eventTypes';
import { ANIMALS_PATH } from '../list/AnimalListPage';
import type { AnimalDetail, AnimalEvent, BullService } from './api';
import { AvailabilityFact, GroupFact } from './ProfileEdits';
import {
  ageInMonths,
  currentWeight,
  dietHistory,
  reproMilestone,
  semenOnly,
  showsDel,
  type EventCategory,
} from './profileFacts';

interface ProfileSummaryProps {
  animal: AnimalDetail;
  events: AnimalEvent[];
  /** Lts promedio; undefined while unknown or not visible to this user. */
  avgLiters?: number | null;
  /** A bull's services, newest first: his Reproducción card. Undefined for a cow. */
  services?: BullService[];
  today: Date;
  /** Where "Consultar historial" goes: the records, on a tab or filtered to a category. */
  recordsHref: (target: { tab?: string; tipo?: EventCategory }) => string;
  /** Null hides Eliminar (no permission, or already removed). */
  onRemove: (() => void) | null;
  /** Null hides Registros (the web layout shows them beside the profile). */
  registrosHref: string | null;
  /** Shows Cambiar on her potrero (EVENTS_RECORD: the move is a GROUP_CHANGE). */
  canMove: boolean;
  /** Shows Cambiar on his availability (ANIMALS_EDIT: it goes through the animal's PATCH). */
  canSetAvailability: boolean;
  /** Registrar on the Reproducción and Salud cards opens the event launcher; null hides it. */
  onRecord: ((group: LauncherGroup) => void) | null;
}

const shortDate = (iso: string) => format(parseISO(iso), 'dd/MM/yyyy');

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-moon-i-xs bg-neutral-1 text-center shadow-moon-sm">
      <span className="truncate bg-primary px-2 py-1 text-button-text type-label-md">{label}</span>
      <span className="truncate px-2 py-1 type-body-md">{value}</span>
    </div>
  );
}

function InfoCard({
  title,
  icon,
  link,
  action,
  children,
}: {
  title: string;
  icon: Glyph;
  /** "Consultar historial"; the genealogy has no tree to open yet, so it has none. */
  link?: { href: string; label: string };
  /** Registrar: opens the event launcher for this card. */
  action?: { label: string; onClick: () => void };
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-col overflow-hidden rounded-moon-i-sm bg-neutral-1 shadow-moon-sm"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-1 p-3 text-center">
        {children}
        {action && (
          <Button
            size="sm"
            variant="outline"
            leadingIcon={iconPlus}
            onClick={action.onClick}
            aria-label={`${action.label}: ${title}`}
            className="mt-1"
          >
            {action.label}
          </Button>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 bg-secondary-background px-2 py-2">
        <Icon icon={icon} size={24} className="text-primary" />
        <h3 className="type-label-md">{title}</h3>
      </div>
      {link && (
        <Link
          to={link.href}
          className={cx(
            'bg-primary px-2 py-1 text-center text-button-text type-label-md hover:bg-primary-dark',
            focusRing,
          )}
        >
          {link.label}
        </Link>
      )}
    </section>
  );
}

function Parent({
  label,
  id,
  controlId,
}: {
  label: string;
  id: string | null;
  controlId?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-moon-i-xs border border-primary text-center">
      <span className="bg-primary px-1 text-button-text type-label-sm">{label}</span>
      {id ? (
        <Link
          to={`${ANIMALS_PATH}/${id}`}
          className={cx('truncate px-1 py-1 text-primary underline type-body-sm', focusRing)}
        >
          {controlId ?? t('profile.cards.noRecord')}
        </Link>
      ) : (
        <span
          className="truncate px-1 py-1 text-secondary-text type-body-sm"
          title={t('profile.cards.noRecord')}
        >
          {t('animals.none')}
        </span>
      )}
    </div>
  );
}

/** The V4 MVP profile (V 4000-10263, 4048-10361): photo, chips, tiles and the four cards. A bull
 * kept only as semen shows just his genealogy and the cows he served. */
export function ProfileSummary({
  animal,
  events,
  avgLiters,
  today,
  recordsHref,
  services,
  onRemove,
  registrosHref,
  canMove,
  canSetAvailability,
  onRecord,
  parents,
}: ProfileSummaryProps & { parents: { dam?: string; sire?: string } }) {
  const { t } = useTranslation();
  const dash = t('animals.none');
  const weight = currentWeight(animal, events);
  const kg = (value: number | null | undefined) =>
    value == null ? dash : t('profile.tiles.kg', { kg: value });
  const cow = showsDel(animal);
  const milking = cow && animal.lactation_state === 'LACTANDO';
  const del = animal.projection.dim;
  const diet = dietHistory(events)[0];
  const bull = animal.sex === 'MACHO';
  const strawsOnly = semenOnly(animal);
  // Every male carries one, and any of them can be kept only as semen.
  const availability = bull ? animal.bull_availability : null;
  // A bull never calves: his card follows the cows he served (newest first).
  const milestone = bull
    ? services?.[0] && { key: 'lastBullService', date: services[0].occurred_on }
    : reproMilestone(animal);
  const sickKey = animal.sex === 'MACHO' ? 'enfermo' : 'enferma';

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-moon-i-sm bg-secondary-background">
        {animal.photo_url ? (
          <img
            src={animal.photo_url}
            alt={t('profile.photoAlt', { id: animal.control_id })}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 text-secondary-text">
            <Icon icon={iconCow} size={96} />
            <span className="type-body-sm">{t('profile.noPhoto')}</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 flex flex-col items-start gap-1">
          <span className="rounded-moon-i-xs bg-neutral-1/90 px-2 py-0.5 type-body-sm">
            <span className="mr-1 text-primary type-label-sm">{t('profile.raza')}</span>
            {t(`animals.values.raza.${animal.breed}`)}
          </span>
          {animal.crossbreed_level !== 'FB' && (
            <span className="rounded-moon-i-xs bg-neutral-1/90 px-2 py-0.5 type-body-sm">
              <span className="mr-1 text-primary type-label-sm">{t('profile.cruza')}</span>
              {animal.contributing_breed
                ? `${t(`animals.values.raza.${animal.contributing_breed}`)} `
                : ''}
              {t(`animalForm.crossbreed.${animal.crossbreed_level}`)}
            </span>
          )}
        </div>
      </div>

      <div className={cx('grid gap-2', strawsOnly ? 'grid-cols-2' : 'grid-cols-3')}>
        {/* Nobody weighs a bull kept only as semen. */}
        {!strawsOnly && <Tile label={t('profile.tiles.peso')} value={kg(weight)} />}
        {milking ? (
          <>
            <Tile
              label={t('profile.tiles.del')}
              value={del == null ? dash : t('profile.tiles.days', { count: del })}
            />
            <Tile
              label={t('profile.tiles.lts')}
              value={
                avgLiters == null
                  ? dash
                  : t('profile.tiles.ltsValue', { lts: Math.round(avgLiters * 10) / 10 })
              }
            />
          </>
        ) : (
          <>
            {cow ? (
              <Tile
                label={t('profile.tiles.del')}
                value={del == null ? dash : t('profile.tiles.days', { count: del })}
              />
            ) : (
              <Tile
                label={t('profile.tiles.edad')}
                value={t('animals.months', { count: ageInMonths(animal, today) })}
              />
            )}
            <Tile label={t('profile.tiles.pesoNacer')} value={kg(animal.weight_birth_kg)} />
          </>
        )}
      </div>

      {/* Cows live in potreros; heifers go by age and bulls have none. */}
      {(animal.kind === 'VACA' || availability) && (
        <div className="flex flex-col divide-y divide-secondary-background rounded-moon-i-sm bg-neutral-1 shadow-moon-sm">
          {animal.kind === 'VACA' && <GroupFact animal={animal} editable={canMove} />}
          {availability && (
            <AvailabilityFact
              animal={{ ...animal, bull_availability: availability }}
              editable={canSetAvailability}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InfoCard title={t('profile.cards.genealogia')} icon={iconUsers}>
          <div className="flex w-full gap-2">
            <Parent label={t('profile.cards.padre')} id={animal.sire_id} controlId={parents.sire} />
            <Parent label={t('profile.cards.madre')} id={animal.dam_id} controlId={parents.dam} />
          </div>
        </InfoCard>
        {!strawsOnly && (
          <InfoCard
            title={t('profile.cards.dieta')}
            icon={iconDiet}
            link={{ href: recordsHref({ tab: 'dieta' }), label: t('profile.cards.consultar') }}
          >
            <span className="text-secondary-text type-body-sm">{t('profile.cards.tipoDieta')}</span>
            <span className="type-title-sm">{diet ? (diet.dietType ?? diet.diet) : dash}</span>
          </InfoCard>
        )}
        <InfoCard
          title={t('profile.cards.reproduccion')}
          icon={iconAnimalReproduction}
          link={{
            href: recordsHref(bull ? { tab: 'servicios' } : { tipo: 'reproduccion' }),
            label: t('profile.cards.consultar'),
          }}
          action={
            onRecord && launcherGroups(animal).includes('reproduccion')
              ? { label: t('events.registrar'), onClick: () => onRecord('reproduccion') }
              : undefined
          }
        >
          <span className="text-secondary-text type-body-sm">
            {t(`profile.cards.${milestone?.key ?? (bull ? 'lastBullService' : 'lastCalving')}`)}
          </span>
          <span className="type-title-sm">{milestone ? shortDate(milestone.date) : dash}</span>
        </InfoCard>
        {!strawsOnly && (
          <InfoCard
            title={t('profile.cards.salud')}
            icon={iconHealth}
            link={{ href: recordsHref({ tipo: 'salud' }), label: t('profile.cards.consultar') }}
            action={
              onRecord
                ? { label: t('events.registrar'), onClick: () => onRecord('salud') }
                : undefined
            }
          >
            <span className="text-secondary-text type-body-sm">{t('profile.cards.estado')}</span>
            <span className={cx('type-title-sm', animal.is_sick && 'text-error')}>
              {animal.is_sick ? t(`profile.cards.${sickKey}`) : t('profile.cards.saludable')}
            </span>
          </InfoCard>
        )}
      </div>

      {(onRemove || registrosHref) && (
        <div className="flex flex-col gap-3">
          {onRemove && (
            <Button variant="danger" size="lg" leadingIcon={iconTrash} fullWidth onClick={onRemove}>
              {t('profile.eliminar')}
            </Button>
          )}
          {registrosHref && (
            <Link
              to={registrosHref}
              className={cx(
                'flex h-control-lg items-center justify-center gap-2 rounded-moon-i-xs bg-primary px-5 text-button-text type-label-lg hover:bg-primary-dark',
                focusRing,
              )}
            >
              <Icon icon={iconClipboard} size={24} />
              {t('profile.registros')}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
