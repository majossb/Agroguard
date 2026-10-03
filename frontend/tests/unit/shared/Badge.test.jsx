import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../../src/shared/ui/Badge.jsx';

describe('Shared/UI — Badge', () => {
  it('Renderiza correctamente el estado HEALTHY con icono y texto en español', () => {
    render(<Badge status="HEALTHY" />);
    expect(screen.getByText('Sana')).toBeInTheDocument();
  });

  it('Renderiza correctamente el estado DISEASED con texto en español', () => {
    render(<Badge status="DISEASED" />);
    expect(screen.getByText('Enferma')).toBeInTheDocument();
  });

  it('Renderiza correctamente el estado INCONCLUSIVE con texto en español', () => {
    render(<Badge status="INCONCLUSIVE" />);
    expect(screen.getByText('No concluyente')).toBeInTheDocument();
  });

  it('Renderiza con etiqueta personalizada cuando se provee label', () => {
    render(<Badge status="HEALTHY" label="Planta saludable" />);
    expect(screen.getByText('Planta saludable')).toBeInTheDocument();
  });

  it('Renderiza Badge de variante neutral con texto genérico', () => {
    render(<Badge label="Catálogo" variant="neutral" />);
    expect(screen.getByText('Catálogo')).toBeInTheDocument();
  });
});

describe('Shared/UI — Badge (Seguridad — Sin XSS)', () => {
  it('No ejecuta etiquetas HTML en el label', () => {
    render(<Badge label="<script>alert('xss')</script>" variant="neutral" />);
    // React escapa automáticamente el contenido, no debe haber scripts ejecutados
    expect(document.querySelector('script')).toBeNull();
    // El texto debe aparecer como texto plano
    expect(screen.getByText(/<script>alert\('xss'\)<\/script>/)).toBeInTheDocument();
  });
});
