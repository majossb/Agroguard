import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../../../src/shared/ui/ProgressBar.jsx';

describe('Shared/UI — ProgressBar', () => {
  it('Renderiza correctamente con valor entre 0 y 1', () => {
    render(<ProgressBar value={0.75} showLabel label="Confianza" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '75');
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('Clampea valores fuera del rango [0,1]', () => {
    render(<ProgressBar value={2.5} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });

  it('Aplica el color correcto para estado DISEASED', () => {
    const { container } = render(<ProgressBar value={0.9} status="DISEASED" />);
    const fill = container.querySelector('.bg-granate');
    expect(fill).toBeInTheDocument();
  });

  it('Aplica el color correcto para estado HEALTHY', () => {
    const { container } = render(<ProgressBar value={0.9} status="HEALTHY" />);
    const fill = container.querySelector('.bg-accent');
    expect(fill).toBeInTheDocument();
  });
});
