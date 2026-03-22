import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createStore } from '@nexus-state/core';
import { StoreProvider } from '@nexus-state/react';
import { createForm } from '../../create-form';
import { useFieldInArray } from '../useFieldInArray';

describe('useFieldInArray integration', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider store={store}>{children}</StoreProvider>
  );

  interface Address {
    street: string;
    city: string;
  }

  describe('array of objects', () => {
    it('should render fields with correct values', () => {
      function AddressForm() {
        const form = createForm(store, {
          initialValues: {
            addresses: [{ street: '123 Main St', city: 'NYC' }]
          }
        });

        const array = form.fieldArray('addresses', { street: '', city: '' });

        return (
          <div>
            {array.fields.map((_, index) => {
              const street = useFieldInArray(array, index, 'street');
              const city = useFieldInArray(array, index, 'city');

              return (
                <div key={index} data-testid={`address-${index}`}>
                  <input
                    data-testid={`street-${index}`}
                    value={street.value as string}
                    onChange={street.onChange}
                    onBlur={street.onBlur}
                    placeholder="Street"
                  />
                  <input
                    data-testid={`city-${index}`}
                    value={city.value as string}
                    onChange={city.onChange}
                    placeholder="City"
                  />
                </div>
              );
            })}
          </div>
        );
      }

      render(<AddressForm />, { wrapper });

      const streetInput = screen.getByTestId('street-0') as HTMLInputElement;
      const cityInput = screen.getByTestId('city-0') as HTMLInputElement;

      expect(streetInput.value).toBe('123 Main St');
      expect(cityInput.value).toBe('NYC');
    });

    it('should provide correct field names', () => {
      let fieldNames: string[] = [];

      function AddressForm() {
        const form = createForm(store, {
          initialValues: {
            addresses: [{ street: '123 Main St', city: 'NYC' }]
          }
        });

        const array = form.fieldArray('addresses', { street: '', city: '' });

        return (
          <div>
            {array.fields.map((_, index) => {
              const street = useFieldInArray(array, index, 'street');
              const city = useFieldInArray(array, index, 'city');

              if (index === 0) {
                fieldNames = [street.name, city.name];
              }

              return (
                <div key={index}>
                  <input
                    data-testid={`street-${index}`}
                    value={street.value as string}
                    onChange={street.onChange}
                    placeholder="Street"
                  />
                  <input
                    data-testid={`city-${index}`}
                    value={city.value as string}
                    onChange={city.onChange}
                    placeholder="City"
                  />
                </div>
              );
            })}
          </div>
        );
      }

      render(<AddressForm />, { wrapper });

      expect(fieldNames).toEqual(['addresses[0].street', 'addresses[0].city']);
    });

    it('should handle multiple array items', () => {
      function MultiAddressForm() {
        const form = createForm(store, {
          initialValues: {
            addresses: [
              { street: '123 Main St', city: 'NYC' },
              { street: '456 Oak Ave', city: 'LA' }
            ]
          }
        });

        const array = form.fieldArray('addresses', { street: '', city: '' });

        return (
          <div>
            {array.fields.map((_, index) => {
              const street = useFieldInArray(array, index, 'street');
              const city = useFieldInArray(array, index, 'city');

              return (
                <div key={index} data-testid={`address-${index}`}>
                  <input
                    data-testid={`street-${index}`}
                    value={street.value as string}
                    onChange={street.onChange}
                    placeholder="Street"
                  />
                  <input
                    data-testid={`city-${index}`}
                    value={city.value as string}
                    onChange={city.onChange}
                    placeholder="City"
                  />
                </div>
              );
            })}
          </div>
        );
      }

      render(<MultiAddressForm />, { wrapper });

      const street0Input = screen.getByTestId('street-0') as HTMLInputElement;
      const city0Input = screen.getByTestId('city-0') as HTMLInputElement;
      const street1Input = screen.getByTestId('street-1') as HTMLInputElement;
      const city1Input = screen.getByTestId('city-1') as HTMLInputElement;

      expect(street0Input.value).toBe('123 Main St');
      expect(city0Input.value).toBe('NYC');
      expect(street1Input.value).toBe('456 Oak Ave');
      expect(city1Input.value).toBe('LA');
    });
  });
});
