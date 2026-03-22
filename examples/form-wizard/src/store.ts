import { atom } from '@nexus-state/core';
import { z } from 'zod';

// Types
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Address {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface Preferences {
  newsletter: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface FormData {
  personal: PersonalInfo;
  address: Address;
  preferences: Preferences;
}

// Validation schemas
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().min(5, 'ZIP code must be at least 5 characters'),
  country: z.string().min(1, 'Country is required'),
});

export const preferencesSchema = z.object({
  newsletter: z.boolean(),
  notifications: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
});

// Form state atoms
export const personalInfoAtom = atom<PersonalInfo & { errors: Partial<Record<keyof PersonalInfo, string>>; touched: Partial<Record<keyof PersonalInfo, boolean>> }>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  errors: {},
  touched: {},
});

export const addressAtom = atom<Address & { errors: Partial<Record<keyof Address, string>>; touched: Partial<Record<keyof Address, boolean>> }>({
  street: '',
  city: '',
  zipCode: '',
  country: '',
  errors: {},
  touched: {},
});

export const preferencesAtom = atom<Preferences>({
  newsletter: false,
  notifications: true,
  theme: 'system',
});

// Wizard state atom
export const wizardStepAtom = atom<number>(1);
export const wizardCompletedAtom = atom<boolean>(false);
export const submittedDataAtom = atom<FormData | null>(null);

// Computed atoms
export const isPersonalInfoValidAtom = atom((get) => {
  const data = get(personalInfoAtom);
  const result = personalInfoSchema.safeParse({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
  });
  return result.success;
});

export const isAddressValidAtom = atom((get) => {
  const data = get(addressAtom);
  const result = addressSchema.safeParse({
    street: data.street,
    city: data.city,
    zipCode: data.zipCode,
    country: data.country,
  });
  return result.success;
});

export const canProceedToStep2Atom = atom((get) => get(isPersonalInfoValidAtom));
export const canProceedToStep3Atom = atom((get) => get(isAddressValidAtom));
export const canSubmitAtom = atom((get) => 
  get(isPersonalInfoValidAtom) && get(isAddressValidAtom)
);

export const reviewDataAtom = atom((get) => ({
  personal: get(personalInfoAtom),
  address: get(addressAtom),
  preferences: get(preferencesAtom),
}));

// Actions
export const validatePersonalInfo = (data: PersonalInfo) => {
  const result = personalInfoSchema.safeParse(data);
  if (!result.success) {
    const errors: Partial<Record<keyof PersonalInfo, string>> = {};
    result.error.errors.forEach((err) => {
      const field = err.path[0] as keyof PersonalInfo;
      errors[field] = err.message;
    });
    return errors;
  }
  return {};
};

export const validateAddress = (data: Address) => {
  const result = addressSchema.safeParse(data);
  if (!result.success) {
    const errors: Partial<Record<keyof Address, string>> = {};
    result.error.errors.forEach((err) => {
      const field = err.path[0] as keyof Address;
      errors[field] = err.message;
    });
    return errors;
  }
  return {};
};
