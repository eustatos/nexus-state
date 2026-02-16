import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createStore } from '@nexus-state/core';
import RegistrationForm from '../src/App';

describe('Forms Granularity Demo', () => {
  test('renders form with country and city selectors', () => {
    render(<RegistrationForm />);
    
    expect(screen.getByText('Форма регистрации')).toBeInTheDocument();
    expect(screen.getByLabelText('Страна:')).toBeInTheDocument();
    expect(screen.getByLabelText('Город:')).toBeInTheDocument();
  });

  test('city selector is disabled when no country is selected', () => {
    render(<RegistrationForm />);
    
    const citySelect = screen.getByLabelText('Город:');
    expect(citySelect).toBeDisabled();
  });

  test('selecting Russia shows Russian cities', () => {
    render(<RegistrationForm />);
    
    const countrySelect = screen.getByLabelText('Страна:');
    fireEvent.change(countrySelect, { target: { value: 'RU' } });
    
    const citySelect = screen.getByLabelText('Город:');
    expect(citySelect).not.toBeDisabled();
    
    expect(screen.getByText('Москва')).toBeInTheDocument();
    expect(screen.getByText('Санкт-Петербург')).toBeInTheDocument();
    expect(screen.getByText('Казань')).toBeInTheDocument();
  });

  test('selecting Ukraine shows Ukrainian cities', () => {
    render(<RegistrationForm />);
    
    const countrySelect = screen.getByLabelText('Страна:');
    fireEvent.change(countrySelect, { target: { value: 'UA' } });
    
    const citySelect = screen.getByLabelText('Город:');
    expect(citySelect).not.toBeDisabled();
    
    expect(screen.getByText('Киев')).toBeInTheDocument();
    expect(screen.getByText('Львов')).toBeInTheDocument();
    expect(screen.getByText('Одесса')).toBeInTheDocument();
  });

  test('changing country resets city selection', () => {
    render(<RegistrationForm />);
    
    // Select Russia and a city
    const countrySelect = screen.getByLabelText('Страна:');
    fireEvent.change(countrySelect, { target: { value: 'RU' } });
    
    const citySelect = screen.getByLabelText('Город:');
    fireEvent.change(citySelect, { target: { value: 'Москва' } });
    
    expect(screen.getByText('Вы выбрали: RU, Москва')).toBeInTheDocument();
    
    // Change country to Ukraine
    fireEvent.change(countrySelect, { target: { value: 'UA' } });
    
    // City should be reset
    expect(citySelect.value).toBe('');
    expect(screen.queryByText('Вы выбрали: UA, Москва')).not.toBeInTheDocument();
  });

  test('displays selected country and city', () => {
    render(<RegistrationForm />);
    
    const countrySelect = screen.getByLabelText('Страна:');
    fireEvent.change(countrySelect, { target: { value: 'RU' } });
    
    const citySelect = screen.getByLabelText('Город:');
    fireEvent.change(citySelect, { target: { value: 'Казань' } });
    
    expect(screen.getByText('Вы выбрали: RU, Казань')).toBeInTheDocument();
  });
});