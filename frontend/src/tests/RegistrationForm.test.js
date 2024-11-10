import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import RegistrationForm from './RegistrationForm';
import { MemoryRouter } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('RegistrationForm Component', () => {
  let mockNavigate;

  beforeEach(() => {
    mockNavigate = jest.fn();
    global.alert = jest.fn(); // Mock alert
    global.fetch = jest.fn(); // Mock fetch
  });

  test('submits the form successfully', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Registration successful' }),
    });

    render(
      <MemoryRouter>
        <RegistrationForm />
      </MemoryRouter>
    );

    // Simulate form input
    fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Email Address/i), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByPlaceholderText(/^Confirm Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByPlaceholderText(/Account Number/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText(/ID Number/i), { target: { value: '8001015009087' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    // Wait for the navigation to happen
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/Login');
      expect(global.alert).toHaveBeenCalledWith('Registration successful!');
    });
  });

  test('handles fetch failure gracefully', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Registration failed. Please try again.' }),
    });

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
      expect(global.alert).toHaveBeenCalledWith('Registration failed: Registration failed. Please try again.');
    });
  });
});
