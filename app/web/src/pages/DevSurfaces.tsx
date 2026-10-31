import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '../ui/Banner';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DataTable, type DataTableColumn, type DataTableRowAction } from '../ui/DataTable';
import { EmptyState } from '../ui/EmptyState';
import { FilterPanel, type FilterCategories, type FilterOf } from '../ui/FilterPanel';
import { IconButton } from '../ui/IconButton';
import {
  iconDiscCalving,
  iconDiscHeat,
  iconDiscPregnant,
  iconDiscSick,
  iconFilter,
  iconRefresh,
  iconTrash,
} from '../ui/icons/glyphs';
import { KpiTile } from '../ui/KpiTile';
import { Modal } from '../ui/Modal';
import { Pagination } from '../ui/Pagination';
import { Snackbar } from '../ui/Snackbar';
import { Tabs } from '../ui/Tabs';
import { TextField } from '../ui/TextField';
import { useSnackbar } from '../ui/useSnackbar';
import { Wizard } from '../ui/Wizard';

import { DevSection as Section } from './DevSection';

// The second half of the /dev/ui preview. Sample data is fixture data, in Spanish like the app.

const filterCategories = {
  grupo: {
    label: 'Grupo',
    defaultVariable: 'General',
    variables: [
      { value: 'General', label: 'General' },
      { value: 'Alta producción', label: 'Alta producción' },
      { value: 'Enfermas', label: 'Enfermas' },
    ],
  },
  raza: {
    label: 'Raza',
    defaultVariable: 'Holstein',
    variables: [
      { value: 'Holstein', label: 'Holstein' },
      { value: 'Jersey', label: 'Jersey' },
      { value: 'Simmental', label: 'Simmental' },
    ],
  },
  estado: {
    label: 'Reproducción',
    defaultVariable: 'Vacía',
    variables: [
      { value: 'Vacía', label: 'Vacía' },
      { value: 'Gestante', label: 'Gestante' },
      { value: 'Bajas', label: 'Sin animales (prueba)' },
    ],
  },
} as const satisfies FilterCategories;
type Filter = FilterOf<typeof filterCategories>;

interface Cow {
  id: string;
  raza: string;
  estado: string;
  dim: number | null;
  grupo: string;
}

const herd: Cow[] = Array.from({ length: 23 }, (_, index) => ({
  id: String(index + 1).padStart(5, '0'),
  raza: ['Holstein', 'Jersey', 'Simmental'][index % 3] ?? '',
  estado: ['Vacía', 'Gestante'][index % 2] ?? '',
  dim: index % 5 === 4 ? null : (index * 37) % 300,
  grupo: ['General', 'Alta producción', 'Enfermas'][index % 3] ?? '',
}));

const columns: DataTableColumn<Cow>[] = [
  { key: 'id', header: 'ID Vaca', sortValue: (cow) => cow.id },
  { key: 'raza', header: 'Raza', sortValue: (cow) => cow.raza, hideOnMobile: true },
  { key: 'estado', header: 'Estado', sortValue: (cow) => cow.estado },
  { key: 'dim', header: 'DIM', sortValue: (cow) => cow.dim, cell: (cow) => cow.dim ?? '—' },
  { key: 'grupo', header: 'Grupo', sortValue: (cow) => cow.grupo, hideOnMobile: true },
];

function matches(cow: Cow, filter: Filter | null) {
  if (!filter) return true;
  if (filter.category === 'grupo') return cow.grupo === filter.variable;
  if (filter.category === 'raza') return cow.raza === filter.variable;
  return cow.estado === filter.variable;
}

function SurfaceDemos() {
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [sheet, setSheet] = useState(false);
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => setModal(true)}>
        Abrir modal
      </Button>
      <Button variant="outline" onClick={() => setConfirm(true)}>
        Abrir confirmación
      </Button>
      <Button variant="outline" onClick={() => setSheet(true)}>
        Abrir hoja inferior
      </Button>
      <Modal
        open={modal}
        onOpenChange={setModal}
        title="Registro de celo"
        description="Revisa los datos antes de registrar."
        footer={<Button onClick={() => setModal(false)}>Registrar evento</Button>}
      >
        <TextField label="Descripción" />
      </Modal>
      <ConfirmDialog
        danger
        open={confirm}
        onOpenChange={setConfirm}
        title="Eliminar evento en bitacora"
        description="¿Seguro que quieres eliminar este evento de la bitacora? Una vez eliminado el evento, no quedara ningun registro en el sistema."
        confirmLabel="Si, eliminar"
        onConfirm={() => setConfirm(false)}
      />
      <BottomSheet
        open={sheet}
        onOpenChange={setSheet}
        title="Hoja inferior"
        footer={<Button onClick={() => setSheet(false)}>Listo</Button>}
      >
        <p className="type-body-md">Arrastra la barra hacia abajo para cerrar.</p>
      </BottomSheet>
    </div>
  );
}

function FeedbackDemos() {
  const { show } = useSnackbar();
  const [saved, setSaved] = useState(true);
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => show({ message: 'Celo Registrado', icon: iconDiscHeat })}
        >
          Registrar celo
        </Button>
        <Button
          variant="outline"
          onClick={() => show({ kind: 'deleted', message: 'Evento en bitácora eliminado' })}
        >
          Eliminar evento
        </Button>
        <Button
          variant="outline"
          onClick={() => show({ kind: 'error', message: 'Falla de conexión, intenta más tarde' })}
        >
          Simular falla
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Snackbar message="Parto Registrado" icon={iconDiscCalving} onClose={() => undefined} />
        <Snackbar message="Vaca 00001 Estado de Salud Registrado" icon={iconDiscSick} />
      </div>
      {saved && (
        <Banner tone="error" onClose={() => setSaved(false)}>
          Selecciona al menos un canal
        </Banner>
      )}
      <Banner tone="warning" title="Atención">
        Llevas 45 vacas de 50 en tu plan.
      </Banner>
      <Banner tone="info">Parto estimado entre los días 12 al 14 de abril del 2021.</Banner>
      <Banner tone="success">Tu rancho está al día.</Banner>
    </>
  );
}

function CardDemos() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Enfermas"
          value="003"
          icon={iconDiscSick}
          tone="success"
          onClick={() => undefined}
        />
        <KpiTile
          label="Preñadas"
          value="012"
          icon={iconDiscPregnant}
          tone="primary"
          onClick={() => undefined}
        />
        <KpiTile label="Celos" value="002" icon={iconDiscHeat} tone="error" />
        <KpiTile label="Partos" value="001" icon={iconDiscCalving} tone="info" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <KpiTile
          label="Por confirmar"
          icon={iconDiscHeat}
          tone="error"
          rows={[
            { value: '04', label: 'celos hoy' },
            { value: '02', label: 'esta semana' },
          ]}
        />
        <Card title="Potrero General" footer={<Button size="sm">Editar</Button>}>
          <p className="type-body-md">Aquí están todas las vacas en tu rancho.</p>
        </Card>
      </div>
      <Card variant="flat">
        <EmptyState
          title="Aún no tienes vacas"
          description="Agrega la primera para empezar."
          action={<Button>Agregar Vaca</Button>}
        />
      </Card>
    </>
  );
}

function TableAndFilters() {
  const [filter, setFilter] = useState<Filter | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [sheet, setSheet] = useState(false);
  const [lastAction, setLastAction] = useState('');
  const rows = useMemo(() => herd.filter((cow) => matches(cow, filter)), [filter]);
  const rowActions: DataTableRowAction<Cow>[] = [
    {
      label: 'Mover',
      icon: iconRefresh,
      hideOnMobile: true,
      onClick: (cow) => setLastAction(`Mover ${cow.id}`),
    },
    { label: 'Eliminar', icon: iconTrash, onClick: (cow) => setLastAction(`Eliminar ${cow.id}`) },
  ];
  return (
    <>
      <FilterPanel categories={filterCategories} value={filter} onApply={setFilter} />
      <div className="flex items-center gap-3">
        <IconButton
          icon={iconFilter}
          label="Filtrar en móvil"
          variant="outline"
          onClick={() => setSheet(true)}
        />
        <output data-testid="filter-value" className="type-body-sm break-all">
          {JSON.stringify(filter)}
        </output>
      </div>
      <FilterPanel
        variant="sheet"
        open={sheet}
        onOpenChange={setSheet}
        categories={filterCategories}
        value={filter}
        onApply={setFilter}
      />
      <DataTable
        label="Vacas"
        columns={columns}
        rows={rows}
        getRowId={(cow) => cow.id}
        getRowLabel={(cow) => `vaca ${cow.id}`}
        rowActions={rowActions}
        selected={selected}
        onSelectionChange={setSelected}
      />
      <p data-testid="table-state" className="type-body-sm">
        Seleccionadas: {selected.length}. {lastAction}
      </p>
    </>
  );
}

function TabsDemos() {
  const items = [
    { value: 'perfil', label: 'Perfil', content: 'Datos generales de la vaca.' },
    { value: 'bitacora', label: 'Bitácora', content: 'Eventos registrados.' },
    { value: 'salud', label: 'Salud', content: 'Tratamientos.' },
    { value: 'bajas', label: 'Bajas', disabled: true, content: '' },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Tabs label="Perfil, con línea" items={items} />
      <Tabs label="Perfil, sólidas" items={items} type="solid" />
      <Tabs label="Perfil, simples" items={items} type="default" size="sm" />
    </div>
  );
}

function PaginationDemo() {
  const [page, setPage] = useState(5);
  return (
    <Pagination label="Paginación de ejemplo" page={page} pageCount={12} onPageChange={setPage} />
  );
}

function WizardDemo() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [left, setLeft] = useState(false);
  return (
    <Card className="max-w-md" data-testid="wizard">
      {left ? (
        <Button variant="outline" onClick={() => setLeft(false)}>
          Volver a abrir
        </Button>
      ) : (
        <Wizard
          steps={['Datos generales', 'Método de selección', 'Confirmación']}
          step={step}
          dirty={name !== ''}
          nextDisabled={step === 0 && name === ''}
          onNext={() => (step === 2 ? setLeft(true) : setStep(step + 1))}
          onBack={() => (step === 0 ? setLeft(true) : setStep(step - 1))}
          onDiscard={() => setName('')}
        >
          <TextField
            label="Nombre del potrero"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Wizard>
      )}
    </Card>
  );
}

export function DevSurfaces() {
  const { t } = useTranslation();
  return (
    <>
      <Section id="surfaces" title={t('devUi.surfaces')}>
        <SurfaceDemos />
      </Section>
      <Section id="feedback" title={t('devUi.feedback')}>
        <FeedbackDemos />
      </Section>
      <Section id="cards" title={t('devUi.cards')}>
        <CardDemos />
      </Section>
      <Section id="table" title={t('devUi.table')}>
        <TableAndFilters />
        <PaginationDemo />
      </Section>
      <Section id="tabs" title={t('devUi.tabs')}>
        <TabsDemos />
      </Section>
      <Section id="wizard" title={t('devUi.wizard')}>
        <WizardDemo />
      </Section>
    </>
  );
}
