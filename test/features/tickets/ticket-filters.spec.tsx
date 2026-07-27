import { render, screen } from '@testing-library/react';
import { TicketFilters } from '@/features/tickets/ticket-filters';

describe('filtres de tickets', () => {
  it("restaure les filtres issus de l'URL dans un formulaire GET", () => {
    const { container } = render(
      <TicketFilters values={{ search: 'fibre', status: 'IN_PROGRESS', priority: 'HIGH' }} />,
    );
    expect(screen.getByRole('search')).toHaveAttribute('method', 'GET');
    expect(screen.getByRole('textbox', { name: 'Rechercher un ticket' })).toHaveValue('fibre');
    expect(screen.getByRole('combobox', { name: 'Statut' })).toHaveValue('IN_PROGRESS');
    expect(screen.getByRole('combobox', { name: 'Priorité' })).toHaveValue('HIGH');
    expect(container.querySelector('[name="status"]')).not.toBeNull();
  });
});
