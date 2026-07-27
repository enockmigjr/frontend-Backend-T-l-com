import { canManageReferences, canUseInternalNotes, canViewDashboard } from './index';

describe('permissions d’interface', () => {
  it('réserve le dashboard aux rôles autorisés', () => {
    expect(canViewDashboard('SUPERVISOR').allowed).toBe(true);
    expect(canViewDashboard('NOC_ENGINEER').allowed).toBe(false);
  });

  it('réserve les référentiels à l’administrateur', () => {
    expect(canManageReferences('ADMINISTRATOR').allowed).toBe(true);
    expect(canManageReferences('SUPERVISOR').allowed).toBe(false);
  });

  it('masque les notes internes aux techniciens terrain', () => {
    expect(canUseInternalNotes('FIELD_TECHNICIAN').allowed).toBe(false);
    expect(canUseInternalNotes('TECHNICAL_SUPPORT_ENGINEER').allowed).toBe(true);
  });
});
