import { CreateTicketForm } from '@/features/tickets/create-ticket-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTicketPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Button nativeButton={false} variant="ghost" render={<Link href="/tickets" />}>
        <ArrowLeft />
        Retour aux tickets
      </Button>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Créer un ticket</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consignez l’incident et routez-le vers la bonne équipe dès sa création.
        </p>
      </header>
      <CreateTicketForm />
    </div>
  );
}
