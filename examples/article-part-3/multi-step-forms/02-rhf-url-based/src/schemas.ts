import { z } from 'zod';

// Step 1: Personal Information Schema
export const step1Schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
});

// Step 2: Address Schema
export const step2Schema = z.object({
  street: z.string().min(5, 'Street address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  zipCode: z.string().regex(/^\d{5}$/, 'ZIP code must be 5 digits'),
});

// Step 3: Payment Schema
export const step3Schema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
});

// Combined schema for final submission
export const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);

// Type inference
export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
export type Step3FormData = z.infer<typeof step3Schema>;
export type FullFormData = z.infer<typeof fullSchema>;

// Helper to get schema for current step
export const getStepSchema = (step: number) => {
  switch (step) {
    case 1:
      return step1Schema;
    case 2:
      return step2Schema;
    case 3:
      return step3Schema;
    default:
      return step1Schema;
  }
};

// Initial form data
export const initialFormData: FullFormData = {
  firstName: '',
  lastName: '',
  email: '',
  street: '',
  city: '',
  zipCode: '',
  cardNumber: '',
  expiryDate: '',
  cvv: '',
};
