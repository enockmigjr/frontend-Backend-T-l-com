import { commentSchema, noteSchema } from './schemas';

const listedEntry = {
  id: '019fa300-bf59-7004-84d2-4693443980af',
  ticketId: '019fa300-b253-7004-84d0-b9972666825f',
  authorId: '019f89e0-32f1-7ff5-baa4-ed98c12afcba',
  content: 'Diagnostic interne confirmé.',
  createdAt: '2026-07-27T09:56:03.034Z',
  authorName: 'Admin Système',
};

describe('schémas de collaboration ticket', () => {
  it('accepte une note listée sans updatedAt', () => {
    expect(noteSchema.parse(listedEntry)).toMatchObject(listedEntry);
  });

  it('conserve updatedAt obligatoire pour un commentaire', () => {
    expect(commentSchema.safeParse(listedEntry).success).toBe(false);
  });

  it('accepte un commentaire externe sans auteur interne', () => {
    expect(
      commentSchema.parse({
        ...listedEntry,
        authorId: null,
        actorType: 'EXTERNAL_REQUESTER',
        externalRequesterId: '019fa300-b253-7004-84d0-b9972666825f',
        updatedAt: listedEntry.createdAt,
      }).actorType,
    ).toBe('EXTERNAL_REQUESTER');
  });

  it('applique le fallback INTERNAL aux valeurs legacy', () => {
    expect(noteSchema.parse(listedEntry).actorType).toBe('INTERNAL');
  });
});
