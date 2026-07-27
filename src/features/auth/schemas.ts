import { z } from 'zod';

export const roleSchema = z.enum([
  'CUSTOMER_SERVICE_AGENT',
  'NOC_ENGINEER',
  'BILLING_AGENT',
  'TECHNICAL_SUPPORT_ENGINEER',
  'FIELD_TECHNICIAN',
  'SUPERVISOR',
  'ADMINISTRATOR',
]);

export const currentUserSchema = z
  .object({
    id: z.string().uuid().optional(),
    sub: z.string().uuid().optional(),
    email: z.string().email(),
    departmentId: z.string().uuid(),
    role: roleSchema,
    mustChangePassword: z.boolean().default(false),
  })
  .transform((user) => ({ ...user, id: user.id ?? user.sub ?? '' }));

export type CurrentUser = z.infer<typeof currentUserSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Adresse email invalide.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est requis.'),
    newPassword: z
      .string()
      .min(8, 'Au moins 8 caractères.')
      .regex(/[a-z]/, 'Ajoutez une minuscule.')
      .regex(/[A-Z]/, 'Ajoutez une majuscule.')
      .regex(/\d/, 'Ajoutez un chiffre.')
      .regex(/[@$!%*?&]/, 'Ajoutez un caractère spécial (@$!%*?&).'),
    confirmation: z.string(),
  })
  .refine(({ newPassword, confirmation }) => newPassword === confirmation, {
    path: ['confirmation'],
    message: 'Les mots de passe ne correspondent pas.',
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
