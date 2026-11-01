import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '../ui/Button';
import type { ButtonSize, ButtonVariant } from '../ui/buttonStyles';
import { Checkbox } from '../ui/Checkbox';
import { Chip } from '../ui/Chip';
import { ChipGroup } from '../ui/ChipGroup';
import { CountController } from '../ui/CountController';
import { DateField } from '../ui/DateField';
import { DateRangeField, type IsoRange } from '../ui/DateRangeField';
import { todayIso } from '../ui/dates';
import { FormField } from '../ui/FormField';
import { IconButton } from '../ui/IconButton';
import {
  iconBull,
  iconCalf,
  iconChevronRight,
  iconCow,
  iconFilter,
  iconHeifer,
  iconMail,
  iconPencil,
  iconPlus,
  iconSave,
  iconTrash,
} from '../ui/icons/glyphs';
import { NumberField } from '../ui/NumberField';
import { PhoneField } from '../ui/PhoneField';
import { ProgressBar } from '../ui/ProgressBar';
import { RadioGroup } from '../ui/RadioGroup';
import { Select } from '../ui/Select';
import { SplitIndicator } from '../ui/SplitIndicator';
import { Stepper } from '../ui/Stepper';
import { TextArea } from '../ui/TextArea';
import { TextField } from '../ui/TextField';
import { Toggle } from '../ui/Toggle';

import { DevSection as Section } from './DevSection';
import { DevSurfaces } from './DevSurfaces';

// Internal preview of the base components. Sample labels are fixture data, in Spanish like the app.

const variants: ButtonVariant[] = ['fill', 'outline', 'ghost', 'danger'];
const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const breeds = [
  { value: 'holstein', label: 'Holstein' },
  { value: 'jersey', label: 'Jersey' },
  { value: 'pardo', label: 'Pardo Suizo' },
  { value: 'gyr', label: 'Gyr', disabled: true },
];
const animals = [
  { value: 'cow', label: 'Vaca', icon: iconCow },
  { value: 'heifer', label: 'Vaquilla', icon: iconHeifer },
  { value: 'bull', label: 'Toro', icon: iconBull, disabled: true },
];

const schema = z.object({
  name: z.string().min(1, 'validation.required'),
  phone: z.string().regex(/^\+\d{11,13}$/, 'validation.phone'),
  litres: z.string().refine((v) => Number(v) > 0, 'validation.positive'),
  breed: z.string().min(1, 'validation.required'),
  date: z.string().min(1, 'validation.required'),
  terms: z.boolean().refine(Boolean, 'validation.required'),
});
type Sample = z.input<typeof schema>;

function SampleForm() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState<string>();
  const { control, handleSubmit } = useForm<Sample>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', litres: '', breed: '', date: todayIso(), terms: false },
  });
  return (
    <form
      noValidate
      data-testid="sample-form"
      onSubmit={handleSubmit((values) => setSaved(JSON.stringify(values)))}
      className="flex max-w-md flex-col gap-4"
    >
      <FormField
        control={control}
        name="name"
        render={(field) => <TextField label="Nombre del rancho" required {...field} />}
      />
      <FormField
        control={control}
        name="phone"
        render={(field) => <PhoneField label="Teléfono" required {...field} />}
      />
      <FormField
        control={control}
        name="litres"
        render={(field) => <NumberField label="Litros" decimals={1} required {...field} />}
      />
      <FormField
        control={control}
        name="breed"
        render={(field) => (
          <Select label="Raza" placeholder="Elige" options={breeds} required {...field} />
        )}
      />
      <FormField
        control={control}
        name="date"
        render={(field) => <DateField label="Fecha" maxDate="today" required {...field} />}
      />
      <FormField
        control={control}
        name="terms"
        render={(field) => <Checkbox label="Acepto los términos" {...field} />}
      />
      <Button type="submit" leadingIcon={iconSave}>
        Guardar
      </Button>
      {saved && (
        <output data-testid="saved" className="type-body-sm break-all">
          {t('devUi.saved', { values: saved })}
        </output>
      )}
    </form>
  );
}

export function DevUiPage() {
  const { t } = useTranslation();
  const [count, setCount] = useState(1);
  const [text, setText] = useState('');
  const [number, setNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [breed, setBreed] = useState('');
  const [range, setRange] = useState<IsoRange | null>(null);
  const [checked, setChecked] = useState(true);
  const [animal, setAnimal] = useState('cow');
  const [plain, setPlain] = useState('auto');
  const [on, setOn] = useState(true);
  const [filters, setFilters] = useState(['cow']);
  const [counter, setCounter] = useState(true);

  return (
    <main className="mx-auto flex max-w-container flex-col gap-12 p-4 md:p-6 lg:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="ramp-page-title">{t('devUi.title')}</h1>
        <p className="ramp-body text-secondary-text">{t('devUi.intro')}</p>
      </header>

      <Section id="buttons" title={t('devUi.buttons')}>
        {variants.map((variant) => (
          <div key={variant} className="flex flex-wrap items-center gap-3">
            {sizes.map((size) => (
              <Button key={size} variant={variant} size={size}>
                {t('devUi.sample')} {size}
              </Button>
            ))}
            <Button variant={variant} leadingIcon={iconPlus}>
              Agregar vaca
            </Button>
            <Button variant={variant} trailingIcon={iconChevronRight}>
              Continuar
            </Button>
            <Button variant={variant} disabled>
              Dar de baja
            </Button>
            <Button variant={variant} loading>
              Guardando
            </Button>
          </div>
        ))}
      </Section>

      <Section id="icon-buttons" title={t('devUi.iconButtons')}>
        <div className="flex flex-wrap items-center gap-3">
          {sizes.map((size) => (
            <IconButton key={size} icon={iconPlus} label={`Agregar ${size}`} size={size} />
          ))}
          <IconButton icon={iconPencil} label="Editar" circle />
          <IconButton icon={iconFilter} label="Filtrar" variant="outline" />
          <IconButton icon={iconPlus} label="Más" variant="ghost" />
          <IconButton icon={iconTrash} label="Borrar" variant="danger" circle />
          <IconButton icon={iconTrash} label="Borrar, inactivo" disabled />
          <IconButton icon={iconSave} label="Guardando" loading />
        </div>
      </Section>

      <Section id="text-fields" title={t('devUi.textFields')}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TextField
            label="Nombre"
            hint="Como aparece en tu INE"
            placeholder="Nombre (s)"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <TextField label="Etiqueta flotante" floatingLabel />
          <TextField label="Correo" type="email" leadingIcon={iconMail} size="lg" />
          <TextField label="Contraseña" type="password" defaultValue="vaca1234" />
          <TextField label="Buscar" type="search" placeholder="ID Vaca" size="sm" />
          <TextField label="Con error" error="Este campo es obligatorio" defaultValue="" />
          <TextField label="Inactivo" disabled defaultValue="Variable" size="xl" />
          <NumberField
            label="Litros (punto decimal)"
            decimals={2}
            unit="L por día"
            value={number}
            onChange={setNumber}
          />
          <TextArea label="Notas" scaling placeholder="Observaciones" />
        </div>
      </Section>

      <Section id="date-fields" title={t('devUi.dateFields')}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DateField label="Hoy por defecto, sin fechas futuras" maxDate="today" />
          <DateField label="Sin límite" />
          <DateField label="Inactivo" disabled />
          <DateRangeField
            label="Periodo"
            maxDate="today"
            value={range}
            onChange={setRange}
            hint="Dos fechas, para filtrar bitácoras"
          />
        </div>
      </Section>

      <Section id="selects" title={t('devUi.selects')}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Raza"
            placeholder="Elige una raza"
            options={breeds}
            value={breed}
            onChange={setBreed}
          />
          <Select label="Con error" options={breeds} error="Elige una raza" placeholder="Elige" />
          <Select label="Inactivo" options={breeds} placeholder="Variable" disabled />
          <PhoneField label="Teléfono" hint="Solo dígitos" value={phone} onChange={setPhone} />
        </div>
      </Section>

      <Section id="selection" title={t('devUi.selection')}>
        <div className="flex flex-wrap items-center gap-6">
          <Checkbox label="Relleno" value={checked} onChange={setChecked} />
          <Checkbox label="Contorno" variant="outline" value={checked} onChange={setChecked} />
          <Checkbox label="Parcial" indeterminate />
          <Checkbox label="Con error" error />
          <Checkbox label="Inactivo" value disabled />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <RadioGroup
            label="Modo"
            options={[
              { value: 'auto', label: 'Automático' },
              { value: 'manual', label: 'Manual' },
              { value: 'off', label: 'Inactivo', disabled: true },
            ]}
            value={plain}
            onChange={setPlain}
          />
          <RadioGroup
            label="Etiqueta a la izquierda"
            buttonPosition="right"
            options={[
              { value: 'a', label: 'Opción A' },
              { value: 'b', label: 'Opción B' },
            ]}
          />
          <RadioGroup
            label="Tipo de animal"
            variant="card"
            orientation="horizontal"
            options={animals}
            value={animal}
            onChange={setAnimal}
          />
          <RadioGroup
            label="Tarjeta de dos líneas"
            variant="card"
            options={[
              { value: 'a', label: 'Automático', description: 'Calculado con tus eventos' },
              { value: 'b', label: 'Manual', description: 'Lo capturas tú' },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Toggle label="2xs" size="2xs" value={on} onChange={setOn} />
          <Toggle label="xs" value={on} onChange={setOn} />
          <Toggle label="sm" size="sm" value={on} onChange={setOn} />
          <Toggle label="Rojo" tone="error" value={on} onChange={setOn} />
          <Toggle label="Verde" tone="success" value={on} onChange={setOn} />
          <Toggle label="Inactivo" disabled value />
        </div>
      </Section>

      <Section id="chips" title={t('devUi.chips')}>
        <ChipGroup
          label="Filtros"
          options={[
            { value: 'cow', label: 'Vacas', icon: iconCow },
            { value: 'heifer', label: 'Vaquillas', icon: iconHeifer },
            { value: 'calf', label: 'Becerras', icon: iconCalf },
            { value: 'bull', label: 'Toros', disabled: true },
          ]}
          value={filters}
          onChange={setFilters}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Chip size="sm">Pequeño</Chip>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SplitIndicator label="Vacas en Sistema" count={128} className="w-[280px] max-w-full" />
          <SplitIndicator
            label="Vacas en Sistema"
            count={0}
            active={false}
            className="w-[280px] max-w-full"
          />
          <SplitIndicator
            label="Vacas"
            icon={iconCow}
            count={8}
            active={counter}
            onClick={() => setCounter((c) => !c)}
          />
          <SplitIndicator
            label="Vaquillas"
            icon={iconHeifer}
            count={8}
            active={false}
            onClick={() => undefined}
          />
          <SplitIndicator
            label="Toros"
            icon={iconBull}
            count={0}
            active={false}
            disabled
            onClick={() => undefined}
          />
          <SplitIndicator label="Becerras" icon={iconCalf} count={12} />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
            <CountController
              key={size}
              label={`Crías ${size}`}
              size={size}
              value={count}
              onChange={setCount}
              max={5}
            />
          ))}
        </div>
      </Section>

      <Section id="progress" title={t('devUi.progress')}>
        <Stepper step={2} total={5} />
        {(['xxs', 'xs', 'sm', 'md', 'lg'] as const).map((size) => (
          <ProgressBar key={size} label={`Progreso ${size}`} value={60} size={size} />
        ))}
        <ProgressBar label="Con marcador" value={40} size="sm" pin />
        <ProgressBar label="Circular" value={75} variant="circular" />
      </Section>

      <Section id="form" title={t('devUi.form')}>
        <SampleForm />
      </Section>

      <DevSurfaces />
    </main>
  );
}
