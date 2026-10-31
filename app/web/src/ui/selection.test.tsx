import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from './Checkbox';
import { Chip } from './Chip';
import { ChipGroup } from './ChipGroup';
import { CountController } from './CountController';
import { ProgressBar } from './ProgressBar';
import { RadioGroup } from './RadioGroup';
import { Stepper } from './Stepper';
import { Toggle } from './Toggle';

describe('uncontrolled use', () => {
  it('lets radios, checkboxes and toggles run themselves', async () => {
    render(
      <>
        <RadioGroup options={[{ value: 'a', label: 'A' }]} />
        <Checkbox label="B" />
        <Toggle label="C" />
      </>,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'A' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'B' }));
    await userEvent.click(screen.getByRole('switch', { name: 'C' }));
    expect(screen.getByRole('radio', { name: 'A' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'B' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'C' })).toBeChecked();
  });
});

describe('Checkbox', () => {
  it('ties an error message to the box', () => {
    render(<Checkbox label="Acepto" error="Obligatorio" />);
    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('Obligatorio');
  });

  it('toggles by click on the label and by Space', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Acepto" value={false} onChange={onChange} />);
    await userEvent.click(screen.getByText('Acepto'));
    expect(onChange).toHaveBeenLastCalledWith(true);
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('exposes the mixed state', () => {
    render(<Checkbox label="Todas" indeterminate />);
    expect(screen.getByRole('checkbox', { name: 'Todas' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  });

  it('does not change while disabled', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="No" disabled onChange={onChange} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('RadioGroup', () => {
  const options = [
    { value: 'a', label: 'Automático' },
    { value: 'm', label: 'Manual', description: 'Lo capturas tú' },
    { value: 'x', label: 'Inactivo', disabled: true },
  ];

  it('names the group', () => {
    render(<RadioGroup label="Modo" options={options} value="a" />);
    expect(screen.getByRole('radiogroup', { name: 'Modo' })).toBeInTheDocument();
  });

  it('selects by clicking anywhere on a card', async () => {
    const onChange = vi.fn();
    render(<RadioGroup variant="card" options={options} value="a" onChange={onChange} />);
    await userEvent.click(screen.getByText('Lo capturas tú'));
    expect(onChange).toHaveBeenCalledWith('m');
  });

  it('skips disabled options', () => {
    render(<RadioGroup options={options} />);
    expect(screen.getByRole('radio', { name: 'Inactivo' })).toBeDisabled();
  });
});

describe('Toggle', () => {
  it('flips with click and keyboard', async () => {
    const onChange = vi.fn();
    render(<Toggle label="Alertas" value={false} onChange={onChange} />);
    const toggle = screen.getByRole('switch', { name: 'Alertas' });
    await userEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith(true);
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('Chip', () => {
  it('exposes selected as pressed', () => {
    render(<Chip selected>Vacas</Chip>);
    expect(screen.getByRole('button', { name: 'Vacas' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('ChipGroup', () => {
  it('adds and removes values', async () => {
    const onChange = vi.fn();
    const options = [
      { value: 'c', label: 'Vacas' },
      { value: 't', label: 'Toros' },
    ];
    render(<ChipGroup label="Filtros" options={options} value={['c']} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Toros' }));
    expect(onChange).toHaveBeenLastCalledWith(['c', 't']);
    await userEvent.click(screen.getByRole('button', { name: 'Vacas' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});

describe('CountController', () => {
  it('steps within its limits', async () => {
    const onChange = vi.fn();
    render(<CountController label="Crías" value={1} min={1} max={2} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Disminuir Crías' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar Crías' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});

describe('ProgressBar', () => {
  it('reports its value and clamps the drawn width', () => {
    render(<ProgressBar label="Carga" value={150} max={100} />);
    const bar = screen.getByRole('progressbar', { name: 'Carga' });
    expect(bar).toHaveAttribute('aria-valuenow', '150');
    expect(bar.firstElementChild).toHaveStyle({ width: '100%' });
  });

  it('draws the circular variant', () => {
    render(<ProgressBar label="Carga" value={50} variant="circular" />);
    expect(screen.getByRole('progressbar').tagName.toLowerCase()).toBe('svg');
  });
});

describe('Stepper', () => {
  it('shows the step of the total', () => {
    render(<Stepper step={2} total={5} />);
    expect(screen.getByText('Paso 2 de 5')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Paso 2 de 5' })).toHaveAttribute(
      'aria-valuemax',
      '5',
    );
  });
});
