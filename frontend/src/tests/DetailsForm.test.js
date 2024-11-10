import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DetailsForm from '../RecipientDetailsPay/DetailsForm.mjs';
import { BrowserRouter as Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

// Mocks for useNavigate and useLocation
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

describe('DetailsForm Component', () => {
  let mockNavigate;
  let mockLocation;

  beforeEach(() => {
    mockNavigate = jest.fn();
    mockLocation = {
      state: {
        recipient: { name: 'John Doe', bank: 'Bank of America', accountNumber: '12345678' },
        amount: '1000',
        swift: 'BOFAUS3N',
        currency: 'USD',
      },
    };

    // Mocking useNavigate and useLocation hooks
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
    require('react-router-dom').useLocation.mockReturnValue(mockLocation);
  });

  test('renders form fields with data from location.state', () => {
    render(
      <Router>
        <DetailsForm />
      </Router>
    );

    expect(screen.getByLabelText(/Recipient's Name:/)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/Recipient's Bank:/)).toHaveValue('Bank of America');
    expect(screen.getByLabelText(/Recipient's Account No:/)).toHaveValue('12345678');
    expect(screen.getByLabelText(/Amount to Transfer:/)).toHaveValue(1000);
    expect(screen.getByLabelText(/Enter SWIFT Code:/)).toHaveValue('BOFAUS3N');
    expect(screen.getByLabelText(/Currency:/)).toHaveValue('USD');
  });

  test('fills out the form and submits successfully', async () => {
    const mockNavigate = jest.fn(); // Mock navigate function
    require('react-router-dom').useNavigate.mockImplementation(() => mockNavigate); // Assign the mock to useNavigate

    // Render the form inside a Router
    render(
      <Router>
        <DetailsForm />
      </Router>
    );

    // Fill out the form fields
    fireEvent.change(screen.getByLabelText(/Recipient's Name:/), { target: { value: 'Alice Smith' } });
    fireEvent.change(screen.getByLabelText(/Recipient's Bank:/), { target: { value: 'Bank of America' } });
    fireEvent.change(screen.getByLabelText(/Recipient's Account No:/), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText(/Amount to Transfer:/), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/Enter SWIFT Code:/), { target: { value: 'BOFAUS3N' } });
    fireEvent.change(screen.getByLabelText(/Currency:/), { target: { value: 'USD' } });

    // Find the form and submit it  
    fireEvent.click(screen.getByRole('button', { name: /PAY Now/i }));

    // Wait for the navigation to happen and assert that it redirects to /Home
    waitFor(async() => expect(mockNavigate).toHaveBeenCalledWith('/Home'));
  });

  test('shows an alert when the form is submitted with missing fields', async () => {
    window.alert = jest.fn();

    render(
      <Router>
        <DetailsForm />
      </Router>
    );

    // Leave 'Recipient Name' empty to trigger validation
    fireEvent.change(screen.getByLabelText(/Recipient's Name:/), { target: { value: '' } });

    fireEvent.click(screen.getByText(/PAY Now/));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Please fill out all fields before proceeding.'));
    expect(window.alert).toHaveBeenCalledTimes(1);
  });

  test('calls API and handles response correctly on form submit', async () => {
    // Mock the fetch API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ message: 'Transaction successful!' }),
    });

    render(
      <Router>
        <DetailsForm />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/Recipient's Name:/), { target: { value: 'Alice Smith' } });
    fireEvent.change(screen.getByLabelText(/Amount to Transfer:/), { target: { value: '1000' } });

    fireEvent.click(screen.getByText(/PAY Now/));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      'https://localhost:3001/users/Payment',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': expect.stringContaining('Bearer'),
        }),
        body: expect.stringContaining('Alice Smith'),
      })
    ));
    expect(window.alert).toHaveBeenCalledWith('Transaction successful: Transaction successful!');
  });

  test('resets form when Cancel button is clicked', () => {
    render(
      <Router>
        <DetailsForm />
      </Router>
    );

    fireEvent.click(screen.getByText(/Cancel/));

    expect(mockNavigate).toHaveBeenCalledWith('/Home');
  });
});
