// LoginForm.test.mjs
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '../CustomerLogin/LoginForm.mjs';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('LoginForm Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('renders login form with input fields and button', () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    expect(screen.getByText(/login form/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('updates input fields correctly', () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    const accountNumberInput = screen.getByLabelText(/account number/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(accountNumberInput, { target: { value: '123456789' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(accountNumberInput.value).toBe('123456789');
    expect(passwordInput.value).toBe('password123');
  });

  test('handles successful login and navigates to dashboard', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'mock-token' }),
      })
    );

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    const accountNumberInput = screen.getByLabelText(/account number/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(accountNumberInput, { target: { value: '123456789' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('https://localhost:3001/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber: '123456789', password: 'password123' }),
      });
      expect(localStorage.getItem('jwt')).toBe('mock-token');
      expect(mockNavigate).toHaveBeenCalledWith('/Home');
    });
  });

  test('displays error message on failed login', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid account number or password' }),
      })
    );

    jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    const accountNumberInput = screen.getByLabelText(/account number/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(accountNumberInput, { target: { value: 'wrongAccount' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongPassword' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('https://localhost:3001/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber: 'wrongAccount', password: 'wrongPassword' }),
      });
      expect(window.alert).toHaveBeenCalledWith('Login failed: Invalid account number or password');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
