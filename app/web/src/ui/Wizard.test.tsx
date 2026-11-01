import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Wizard } from './Wizard';

const steps = ['Datos', 'Método', 'Fin'];

function Host({
  dirty = false,
  onDiscard,
  onBack,
  start = 1,
}: {
  dirty?: boolean;
  onDiscard?: () => void;
  onBack?: () => void;
  start?: number;
}) {
  const [step, setStep] = useState(start);
  return (
    <Wizard
      steps={steps}
      step={step}
      dirty={dirty}
      onNext={() => setStep(step + 1)}
      onBack={() => {
        onBack?.();
        setStep(step - 1);
      }}
      onDiscard={onDiscard}
    >
      Contenido
    </Wizard>
  );
}

const back = () => screen.getByRole('button', { name: 'Regresar' });

describe('Wizard', () => {
  it('shows the step and its progress', () => {
    render(<Host />);
    expect(screen.getByRole('heading', { name: 'Método' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Paso 2 de 3' })).toHaveAttribute(
      'aria-valuenow',
      '2',
    );
  });

  it('leaves focus alone on first render', () => {
    render(<Host />);
    expect(screen.getByRole('heading', { name: 'Método' })).not.toHaveFocus();
  });

  it('labels the last step as finishing', async () => {
    render(<Host start={0} />);
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('heading', { name: 'Fin' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeInTheDocument();
  });

  it('goes straight back when clean', async () => {
    render(<Host />);
    await userEvent.click(back());
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Datos' })).toBeInTheDocument();
  });

  it('asks before going back with dirty data, and can stay', async () => {
    const onBack = vi.fn();
    const onDiscard = vi.fn();
    render(<Host dirty onBack={onBack} onDiscard={onDiscard} />);
    await userEvent.click(back());
    expect(screen.getByRole('alertdialog', { name: '¿Descartar los cambios?' })).toHaveTextContent(
      'se perderán todos los datos',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Seguir editando' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onBack).not.toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Método' })).toBeInTheDocument();
  });

  it('discards, then goes back, once confirmed', async () => {
    const order: string[] = [];
    render(
      <Host dirty onBack={() => order.push('back')} onDiscard={() => order.push('discard')} />,
    );
    await userEvent.click(back());
    await userEvent.click(screen.getByRole('button', { name: 'Sí, descartar' }));
    expect(order).toEqual(['discard', 'back']);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Datos' })).toBeInTheDocument();
  });

  it('has no Regresar without somewhere to go, and blocks Continuar when told', () => {
    render(
      <Wizard steps={steps} step={0} nextDisabled onNext={() => undefined}>
        Contenido
      </Wizard>,
    );
    expect(screen.queryByRole('button', { name: 'Regresar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });
});
