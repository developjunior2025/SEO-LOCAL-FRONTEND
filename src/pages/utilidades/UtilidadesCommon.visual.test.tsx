import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Status, humanizeKey, text } from './UtilidadesCommon';

describe('presentación de Utilidades', () => {
  it('repara el nombre de Bogotá recibido con carácter de reemplazo', () => {
    expect(text('Sede Principal Bogot�')).toBe('Sede Principal Bogotá');
  });

  it('traduce estados técnicos para la interfaz', () => {
    render(<Status value="not_configured" />);
    expect(screen.getByText('Pendiente de conexión').textContent).toBe('Pendiente de conexión');
  });

  it('traduce claves internas del dashboard', () => {
    expect(humanizeKey('workOrders')).toBe('Órdenes de trabajo');
    expect(humanizeKey('reviewCampaigns')).toBe('Campañas de reseñas');
  });
});
