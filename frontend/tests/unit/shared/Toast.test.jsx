import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast } from '../../../src/shared/ui/Toast.jsx';

describe('Shared/UI — Toast (Notificación accesible)', () => {
  it('Renderiza título y mensaje con rol status para tipo success', () => {
    render(
      <Toast
        id="t-1"
        type="success"
        title="¡Cuenta creada exitosamente!"
        message="Inicia sesión con tu correo."
        onClose={() => {}}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('¡Cuenta creada exitosamente!')).toBeInTheDocument();
    expect(screen.getByText('Inicia sesión con tu correo.')).toBeInTheDocument();
  });

  it('Renderiza con rol alert para tipo error', () => {
    render(
      <Toast
        id="t-2"
        type="error"
        title="Error de autenticación"
        message="Credenciales no válidas."
        onClose={() => {}}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error de autenticación')).toBeInTheDocument();
  });

  it('Ejecuta onClose al hacer clic en el botón de cerrar', () => {
    const handleClose = vi.fn();
    render(
      <Toast
        id="t-3"
        type="info"
        title="Aviso"
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Cerrar notificación/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('Se auto-descarta tras la duración configurada', () => {
    vi.useFakeTimers();
    const handleClose = vi.fn();

    render(
      <Toast
        id="t-4"
        type="success"
        title="Operación completada"
        duration={3000}
        onClose={handleClose}
      />
    );

    expect(handleClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
