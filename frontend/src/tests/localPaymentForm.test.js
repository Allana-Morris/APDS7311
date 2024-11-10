import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter as Router } from 'react-router-dom';
import LocalPaymentForm from '../RecipientDetailsPay/localPaymentForm.mjs'; // Adjust path if necessary

// Mock localStorage
beforeAll(() => {
  global.localStorage.setItem('jwt', 'test-jwt-token');
});

describe('LocalPaymentForm', () => {
  test('renders the form fields', () => {
    render(
      <Router>
        <LocalPaymentForm />
      </Router>
    );

    expect(screen.getByLabelText(/Recipient's Name:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Recipient's Bank:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Recipient's Account No:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount to Transfer:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Enter Branch:/i)).toBeInTheDocument();
  });

  test('fills in form data when location.state is passed', () => {
    render(
      <Router>
        <LocalPaymentForm />
      </Router>
    );

    // Simulate location state being passed into the component
    const mockLocation = {
      state: {
        amount: '1000',
        recipient: { name: 'John Doe', bank: 'Bank A', accountNumber: '123456789' },
        branch: 'Main Branch'
      }
    };

    // Manually set location state
    global.window.location = mockLocation;

    expect(screen.getByDisplayValue(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Bank A/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/123456789/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/1000/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Main Branch/i)).toBeInTheDocument();
  });

  test('displays an alert if form is submitted with missing fields', async () => {
    render(
      <Router>
        <LocalPaymentForm />
      </Router>
    );

    const submitButton = screen.getByText(/PAY Now/i);
    userEvent.click(submitButton);

    expect(await screen.findByText(/Please fill out all fields before proceeding/i)).toBeInTheDocument();
  });

  test('submits form and calls the backend', async () => {
    // Mock the fetch API
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Payment successful' })
    });

    render(
      <Router>
        <LocalPaymentForm />
      </Router>
    );

    // Fill out the form fields
    userEvent.type(screen.getByLabelText(/Recipient's Name:/i), 'John Doe');
    userEvent.type(screen.getByLabelText(/Recipient's Bank:/i), 'Bank A');
    userEvent.type(screen.getByLabelText(/Recipient's Account No:/i), '123456789');
    userEvent.type(screen.getByLabelText(/Amount to Transfer:/i), '1000');
    userEvent.type(screen.getByLabelText(/Enter Branch:/i), 'Main Branch');

    const submitButton = screen.getByText(/PAY Now/i);
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://localhost:3001/users/Payment',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('{"recName":"John Doe"')
        })
      );
    });

    expect(await screen.findByText(/Transaction successful: Payment successful/i)).toBeInTheDocument();
  });

  test('resets form and navigates to home on cancel', async () => {
    render(
      <Router>
        <LocalPaymentForm />
      </Router>
    );

    const cancelButton = screen.getByText(/Cancel/i);
    userEvent.click(cancelButton);

    expect(screen.getByLabelText(/Recipient's Name:/i).value).toBe('');
    expect(screen.getByLabelText(/Recipient's Bank:/i).value).toBe('');
    expect(screen.getByLabelText(/Recipient's Account No:/i).value).toBe('');
    expect(screen.getByLabelText(/Amount to Transfer:/i).value).toBe('');
    expect(screen.getByLabelText(/Enter Branch:/i).value).toBe('');
  });
});
