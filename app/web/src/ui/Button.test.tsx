import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';
import { iconPlus } from './icons/glyphs';
import { IconButton } from './IconButton';

describe('Button', () => {
  it('does not submit forms unless asked', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('type', 'button');
  });

  it('maps variant and size to tokens', () => {
    render(
      <Button variant="danger" size="lg">
        Borrar
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('bg-error', 'h-control-lg');
  });

  it('blocks clicks and reports busy while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading leadingIcon={iconPlus} onClick={onClick}>
        Guardar
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toBeNull();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is reachable and operable from the keyboard', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Continuar</Button>);
    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('Button radius', () => {
  it('uses the 4 px token', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button')).toHaveClass('rounded-moon-i-xs');
  });
});

describe('IconButton', () => {
  it('takes its name from the label and can be round', () => {
    render(<IconButton icon={iconPlus} label="Agregar" circle />);
    expect(screen.getByRole('button', { name: 'Agregar' })).toHaveClass('rounded-full');
    expect(screen.getByRole('button')).not.toHaveClass('rounded-moon-i-xs');
  });
});
