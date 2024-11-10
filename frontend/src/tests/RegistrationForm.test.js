import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import RegistrationForm from '../CustomerRegistration/RegistrationForm.mjs';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('RegistrationForm Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('renders registration form fields and button', () => {
    render(
      <MemoryRouter>
        <RegistrationForm />
      </MemoryRouter>
    );

    expect(screen.getByText(/Customer Registration/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Confirm Password$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Account Number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ID Number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
  });

  test('shows error when invalid email is entered', async () => {
    render(
      <MemoryRouter>
        <RegistrationForm />
      </MemoryRouter>
    );
  
    // Ensure error message is not shown initially
    expect(screen.queryByText(/Invalid email format/i)).not.toBeInTheDocument();
  
    fireEvent.change(screen.getByPlaceholderText(/Email Address/i), {
      target: { value: 'invalidemail' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
  
    // Wait for the error message to appear
    await waitFor(() =>
      expect(screen.getByText((content) => content.includes('Invalid email format'))).toBeInTheDocument()
    );
  });

  test('shows error when passwords do not match', async () => {
    render(
      <MemoryRouter>
        <RegistrationForm />
      </MemoryRouter>
    );

    // Verify error message is absent initially
    expect(screen.queryByText(/Passwords do not match/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByPlaceholderText(/^Confirm Password$/i), {
      target: { value: 'DifferentPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    // Wait for the error message to appear
    await waitFor(() =>
      expect(screen.getByText((content) => content.includes('Passwords do not match'))).toBeInTheDocument()
    );
  });

  test('submits the form successfully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Registration successful!' }),
      })
    );

    render(
      <MemoryRouter>
        <RegistrationForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Email Address/i), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByPlaceholderText(/^Confirm Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByPlaceholderText(/Account Number/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText(/ID Number/i), { target: { value: '8001015009087' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('https://localhost:3001/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          accountNumber: '123456',
          idNumber: '8001015009087',
        }),
      });
      expect(mockNavigate).toHaveBeenCalledWith('/Login');
    });
  });

  test('displays error on failed form submission', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Registration failed. Please try again.' }),
      })
    );

    jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <RegistrationForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Email Address/i), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByPlaceholderText(/^Confirm Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByPlaceholderText(/Account Number/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText(/ID Number/i), { target: { value: '8001015009087' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Registration failed: Registration failed. Please try again.');
    });
  });
});
