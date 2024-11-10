import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DetailsForm from '../RecipientDetailsPay/DetailsForm.mjs';

describe('DetailsForm Component', () => {
  
  const mockLocation = {
    state: {
      amount: '1000',
      recipient: {
        name: 'John Doe',
        bank: 'Bank A',
        accountNumber: '123456789'
      },
      swift: 'SWIFT123',
      currency: 'USD'
    }
  };

  // Test case for form render and autofill using location.state
  test('fills in form data when location.state is passed', async () => {
    render(
      <MemoryRouter initialEntries={['/payment']} initialIndex={0}>
        <Routes>
          <Route path="/payment" element={<DetailsForm />} />
        </Routes>
      </MemoryRouter>
    );

    // Check if the form is pre-filled with values from location.state
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bank A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SWIFT123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
  });

  // Test case for form submission with valid input data
  test('submits form with valid data', async () => {
    // Mock the localStorage token
    localStorage.setItem('jwt', 'test-jwt-token');

    render(
      <MemoryRouter initialEntries={['/payment']} initialIndex={0}>
        <Routes>
          <Route path="/payment" element={<DetailsForm />} />
        </Routes>
      </MemoryRouter>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Recipient's Name:/), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Recipient's Bank:/), { target: { value: 'Bank A' } });
    fireEvent.change(screen.getByLabelText(/Recipient's Account No:/), { target: { value: '123456789' } });
    fireEvent.change(screen.getByLabelText(/Amount to Transfer:/), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/Enter SWIFT Code:/), { target: { value: 'SWIFT123' } });

    // Submit the form
    fireEvent.click(screen.getByText('PAY Now'));

    await waitFor(() => {
      // Here you can check if the POST request was made to the correct URL
      // Also, you can check if the alert for success is called (this requires a mock for `alert`).
    });
  });

  // Test case for form validation (missing required fields)
  test('shows alert when form is submitted with missing fields', async () => {
    render(
      <MemoryRouter initialEntries={['/payment']} initialIndex={0}>
        <Routes>
          <Route path="/payment" element={<DetailsForm />} />
        </Routes>
      </MemoryRouter>
    );

    // Submit the form with empty fields
    fireEvent.click(screen.getByText('PAY Now'));

    await waitFor(() => {
      // Check for the alert message when fields are missing
      expect(window.alert).toHaveBeenCalledWith('Please fill out all fields before proceeding.');
    });
  });

  // Test case for form reset functionality
  test('resets the form when cancel is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/payment']} initialIndex={0}>
        <Routes>
          <Route path="/payment" element={<DetailsForm />} />
        </Routes>
      </MemoryRouter>
    );

    // Simulate filling the form
    fireEvent.change(screen.getByLabelText(/Recipient's Name:/), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Recipient's Bank:/), { target: { value: 'Bank A' } });

    // Cancel the form
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      // Check that the fields have been reset to their default values
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
      expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
    });
  });

});
