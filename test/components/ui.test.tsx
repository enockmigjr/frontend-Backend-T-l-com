import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

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
      <Field>
        <FieldLabel htmlFor="title">Titre</FieldLabel>
        <Input id="title" aria-describedby="title-error" />
        <FieldError id="title-error">Le titre est requis</FieldError>
      </Field>,
    );
    expect(screen.getByLabelText('Titre')).toHaveAccessibleDescription('Le titre est requis');
  });
});
