const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),

  email: z
    .string()
    .email('Invalid email address')
    .transform((value) => value.toLowerCase().trim()),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
});

const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .transform((value) => value.toLowerCase().trim()),

  password: z
    .string()
    .min(1, 'Password is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
};