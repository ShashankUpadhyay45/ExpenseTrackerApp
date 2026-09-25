import { z } from 'zod';
export const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1)
    })
});
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string()
    })
});
export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8)
    })
});
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email()
    })
});
