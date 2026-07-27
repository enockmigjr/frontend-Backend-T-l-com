import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';
import { FieldFrame, Input } from '@/components/ui/field';

describe('primitives accessibles', () => {
  it('active un bouton au clavier', async () => {
    const action = jest.fn();
    render(<Button onClick={action}>Créer le ticket</Button>);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('associe le libellé et l’erreur au champ', () => {
    render(
      <FieldFrame id="title" label="Titre" error="Le titre est requis">
        <Input id="title" aria-describedby="title-error" />
      </FieldFrame>,
    );
    expect(screen.getByLabelText('Titre')).toHaveAccessibleDescription('Le titre est requis');
  });
});
