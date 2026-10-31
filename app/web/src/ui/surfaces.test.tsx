import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Banner } from './Banner';
import { BottomSheet } from './BottomSheet';
import { ConfirmDialog } from './ConfirmDialog';
import { iconDiscHeat } from './icons/glyphs';
import { KpiTile } from './KpiTile';
import { Modal } from './Modal';
import { pageItems } from './pageItems';
import { Pagination } from './Pagination';
import { SnackbarProvider } from './SnackbarProvider';
import { Tabs } from './Tabs';
import { useSnackbar, type SnackbarApi } from './useSnackbar';

describe('Modal', () => {
  it('names itself, closes on Escape and from the X', async () => {
    const onOpenChange = vi.fn();
    render(
      <Modal open onOpenChange={onOpenChange} title="Registro de celo" description="Detalle">
        <input aria-label="Dato" />
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Registro de celo' })).toHaveAccessibleDescription(
      'Detalle',
    );
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onOpenChange.mock.calls).toEqual([[false], [false]]);
  });

  it('can leave out the close button', () => {
    render(<Modal open onOpenChange={() => undefined} title="T" closeButton={false} />);
    expect(screen.queryByRole('button', { name: 'Cerrar' })).not.toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  const dialog = (props = {}) => (
    <ConfirmDialog
      open
      onOpenChange={() => undefined}
      title="¿Eliminar?"
      description="No se puede deshacer"
      confirmLabel="Si, eliminar"
      onConfirm={() => undefined}
      {...props}
    />
  );

  it('starts on Cancelar when it is destructive', () => {
    render(dialog({ danger: true }));
    expect(screen.getByRole('alertdialog', { name: '¿Eliminar?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('confirms, and blocks a second run while loading', async () => {
    const onConfirm = vi.fn();
    const { rerender } = render(dialog({ onConfirm }));
    await userEvent.click(screen.getByRole('button', { name: 'Si, eliminar' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    rerender(dialog({ onConfirm, loading: true }));
    expect(screen.getByRole('button', { name: 'Si, eliminar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});

describe('BottomSheet', () => {
  const drag = (distance: number) => {
    const handle = screen.getByTestId('sheet-handle');
    fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 100 + distance, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientY: 100 + distance, pointerId: 1 });
  };

  it('closes on a long drag of the handle, not a short one', () => {
    Element.prototype.setPointerCapture = () => undefined;
    // jsdom's PointerEvent drops clientY.
    vi.stubGlobal('PointerEvent', MouseEvent);
    const onOpenChange = vi.fn();
    render(<BottomSheet open onOpenChange={onOpenChange} title="Filtros" />);
    expect(screen.getByRole('dialog', { name: 'Filtros' })).toBeInTheDocument();
    drag(20);
    expect(onOpenChange).not.toHaveBeenCalled();
    drag(120);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('hides the handle when asked', () => {
    render(<BottomSheet open onOpenChange={() => undefined} title="F" dragHandle={false} />);
    expect(screen.queryByTestId('sheet-handle')).not.toBeInTheDocument();
  });
});

describe('Snackbar', () => {
  afterEach(() => vi.useRealTimers());

  const setup = () => {
    vi.useFakeTimers();
    return renderHook(() => useSnackbar(), { wrapper: SnackbarProvider }).result;
  };
  const show = (api: { current: SnackbarApi }, options: Parameters<SnackbarApi['show']>[0]) => {
    let id = 0;
    act(() => {
      id = api.current.show(options);
    });
    return id;
  };

  it('needs its provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useSnackbar())).toThrow(/SnackbarProvider/);
    vi.restoreAllMocks();
  });

  it('confirms politely, and leaves after 5 s', () => {
    const api = setup();
    show(api, { message: 'Celo Registrado', icon: iconDiscHeat });
    expect(screen.getByRole('status')).toHaveTextContent('Celo Registrado');
    act(() => void vi.advanceTimersByTime(4999));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('announces errors as alerts and leaves them up longer', () => {
    const api = setup();
    show(api, { kind: 'error', message: 'Falla de conexión' });
    act(() => void vi.advanceTimersByTime(7999));
    expect(screen.getByRole('alert')).toHaveTextContent('Falla de conexión');
    act(() => void vi.advanceTimersByTime(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('holds while hovered', () => {
    const api = setup();
    show(api, { message: 'Hola', duration: 1000 });
    const bar = screen.getByRole('status');
    fireEvent.pointerEnter(bar);
    act(() => void vi.advanceTimersByTime(5000));
    expect(bar).toBeInTheDocument();
    fireEvent.pointerLeave(bar);
    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stacks up to three without resetting older timers, and dismisses by id or button', () => {
    const api = setup();
    const first = show(api, { message: 'Uno', duration: 1000 });
    act(() => void vi.advanceTimersByTime(600));
    show(api, { message: 'Dos', duration: 1000 });
    act(() => void vi.advanceTimersByTime(400));
    expect(screen.queryByText('Uno')).not.toBeInTheDocument();
    expect(first).toBeGreaterThan(0);

    for (const message of ['Tres', 'Cuatro', 'Cinco']) show(api, { message, duration: 9000 });
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toEqual([
      'Tres',
      'Cuatro',
      'Cinco',
    ]);

    const fourth = screen.getByText('Cuatro').closest('[role=status]') as HTMLElement;
    fireEvent.click(within(fourth).getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByText('Cuatro')).not.toBeInTheDocument();
  });

  it('dismisses from the API', () => {
    const api = setup();
    const id = show(api, { message: 'Hola' });
    act(() => api.current.dismiss(id));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('Banner', () => {
  it('alerts for errors only, and can be closed', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Banner tone="error" onClose={onClose}>
        Selecciona un canal
      </Banner>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona un canal');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledOnce();
    rerender(<Banner tone="info">Dato</Banner>);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('KpiTile', () => {
  it('is one button when it opens a drill-down', async () => {
    const onClick = vi.fn();
    render(<KpiTile label="Enfermas" value="003" icon={iconDiscHeat} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: /Enfermas.*003.*Ver más/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows rows without a button when static', () => {
    render(<KpiTile label="X" icon={iconDiscHeat} rows={[{ value: '04', label: 'celos hoy' }]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('celos hoy')).toBeInTheDocument();
  });
});

describe('Pagination', () => {
  it.each([
    [1, 1, [1]],
    [1, 4, [1, 2, 3, 4]],
    [1, 5, [1, 2, null, 5]],
    [1, 12, [1, 2, null, 12]],
    [6, 12, [1, null, 5, 6, 7, null, 12]],
    [3, 12, [1, 2, 3, 4, null, 12]],
    [12, 12, [1, null, 11, 12]],
  ])('page %i of %i', (page, count, expected) => {
    expect(pageItems(page, count)).toEqual(expected);
  });

  it('marks the page and stops at the ends', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={3} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Ir a la página 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ir a la página 3' }));
    expect(onPageChange.mock.calls).toEqual([[2], [3]]);
  });
});

describe('Tabs', () => {
  const items = [
    { value: 'a', label: 'Uno', content: 'Contenido uno' },
    { value: 'b', label: 'Dos', content: 'Contenido dos' },
    { value: 'c', label: 'Tres', disabled: true, content: 'Contenido tres' },
  ];

  it('switches with the mouse and the arrows, skipping disabled tabs', async () => {
    function Host() {
      const [value, setValue] = useState('a');
      return <Tabs label="Perfil" items={items} value={value} onChange={setValue} />;
    }
    render(<Host />);
    expect(screen.getByRole('tablist', { name: 'Perfil' })).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Contenido uno');
    await userEvent.click(screen.getByRole('tab', { name: 'Dos' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Contenido dos');
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Uno' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Tres' })).toBeDisabled();
  });

  it('opens on the first enabled tab by itself', () => {
    render(
      <Tabs
        label="P"
        items={[
          { value: 'x', label: 'Inactiva', disabled: true, content: 'No' },
          { value: 'y', label: 'Activa', content: 'Contenido dos' },
        ]}
      />,
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Contenido dos');
  });
});

describe('focus return', () => {
  it('goes back to the button that opened the dialog', async () => {
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Abrir</button>
          <Modal open={open} onOpenChange={setOpen} title="T" />
        </>
      );
    }
    render(<Host />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus());
  });
});
