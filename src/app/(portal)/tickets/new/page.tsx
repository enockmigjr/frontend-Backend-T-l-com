import { CreateTicketForm } from '@/features/tickets/create-ticket-form';

export default function NewTicketPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Créer un ticket</h1>
        <p className="text-sm text-slate-600">Consignez les informations nécessaires au traitement de l’incident.</p>
      </div>
      <CreateTicketForm />
    </div>
  );
}
