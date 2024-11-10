import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter as Router, MemoryRouter, Routes, Route } from 'react-router-dom';
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
    // Mock location.state with form data
    const mockLocation = {
      state: {
        amount: '1000',
        recipient: {
          name: 'John Doe',
          bank: 'Bank A',
          accountNumber: '123456789'
        },
        branch: 'Main Branch'
      }
    };

    render(
      <MemoryRouter initialEntries={['/payment']} initialIndex={0}>
        <Routes>
          <Route path="/payment" element={<LocalPaymentForm />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the useEffect to run and populate the form fields
    waitFor(async () => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Bank A')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Main Branch')).toBeInTheDocument();
    });
  });

  test('displays an alert if form is submitted with missing fields', async () => {
    // Mock the alert function
    global.alert = jest.fn();

    render(
      <MemoryRouter initialEntries={['/payment']} initialIndex={0}>
        <Routes>
          <Route path="/payment" element={<LocalPaymentForm />} />
        </Routes>
      </MemoryRouter>
    );

    // Submit the form with missing fields (leave some fields empty)
    const submitButton = screen.getByText(/PAY Now/i);
    userEvent.click(submitButton);

    // Check if the alert was triggered with the correct message
    expect(global.alert).toHaveBeenCalledWith('Please fill out all fields before proceeding.');
  });

  test('submits form and calls the backend', async () => {
    // Mock the fetch API
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Payment successful' })
    });

    render(
      <MemoryRouter initialEntries={['/payment']} initialIndex={0}>
        <Routes>
          <Route path="/payment" element={<LocalPaymentForm />} />
        </Routes>
      </MemoryRouter>
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
      // Check the fetch call with the exact body content and headers
      expect(global.fetch).toHaveBeenCalledWith(
        'https://localhost:3001/users/Payment',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-jwt-token',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            type: 'local',
            recName: 'John Doe',
            recBank: 'Bank A',
            recAccNo: '123456789',
            amount: '1000',
            branch: 'Main Branch'
          })
        })
      );
    });
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
