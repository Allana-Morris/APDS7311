// Dashboard.test.mjs
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../CustomerDashboard/DashboardForm.mjs';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('Dashboard Component', () => {
  const mockUser = {
    firstName: 'John',
    lastName: 'Doe',
    accountNumber: '123456789',
    balance: 10000,
  };

  const mockTransactions = [
    {
      sender: '123456789',
      recipient: { name: 'Jane Doe' },
      amount: '1500',
      date: '2023-10-10',
      type: 'local',
    },
    {
      sender: '987654321',
      recipient: { name: 'John Doe' },
      amount: '500',
      date: '2023-10-11',
      type: 'international',
    },
  ];

  beforeEach(() => {
    // Mock localStorage for JWT token
    Storage.prototype.getItem = jest.fn(() => 'mock-jwt-token');

    // Mock fetch API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ user: mockUser, transactions: mockTransactions }),
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading initially and fetches user data and transactions', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/hello, john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/current acc/i)).toBeInTheDocument();
      expect(screen.getByText('R10 000,00')).toBeInTheDocument(); // Account balance
    });
  });

  test('displays transactions with correct formatting and pay again button', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  
    // Wait for the page to load and display the transaction data
    await waitFor(async () => {
      // Get all rows and filter based on the color style of the amount column
      const transactionRows = screen
        .getAllByRole('row')
        .filter(row => {
          const amountCell = row.querySelector('td:nth-child(4)'); // Assuming the amount is in the 4th column
          return amountCell && (amountCell.style.color === 'red' || amountCell.style.color === 'green');
        });
  
      // Check there are only the relevant rows (transaction rows) and not headers or empty rows
      expect(transactionRows).toHaveLength(2); // Expecting 2 transaction rows
  
      // Check if the payer name and the transaction details appear correctly in the first transaction row
      const payerColumn1 = transactionRows[0].querySelector('td:nth-child(2)');
      expect(payerColumn1).toHaveTextContent('John Doe'); // Check if the payer is 'John Doe'
  
      // Check the formatting of the amount (e.g., red for negative, green for positive)
      const amountCell1 = transactionRows[0].querySelector('td:nth-child(4)');
      expect(amountCell1).toHaveStyle('color: red'); // Sent amount in red
  
      const amountCell2 = transactionRows[1].querySelector('td:nth-child(4)');
      expect(amountCell2).toHaveStyle('color: green'); // Received amount in green
  
      // Wait for the "Pay again" button to appear in the last column of the transaction row
      const payAgainButton = await screen.findByText(/pay again/i); // Use findByText for async rendering
  
      // Ensure that the button is in the document
      expect(payAgainButton).toBeInTheDocument();
      // Make sure the button has the correct text content
      expect(payAgainButton).toHaveTextContent('Pay again');
    });
  });

  test('navigates to payment pages on button clicks', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText(/make local payment/i));
      expect(mockNavigate).toHaveBeenCalledWith('/LocalPayment');

      fireEvent.click(screen.getByText(/make international payment/i));
      expect(mockNavigate).toHaveBeenCalledWith('/InterPayment');
    });
  });

  test('navigates with transaction data when "Pay again" is clicked', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      const payAgainButton = screen.getByText(/pay again/i);
      fireEvent.click(payAgainButton);

      expect(mockNavigate).toHaveBeenCalledWith('/LocalPayment', {
        state: {
          amount: '1500',
          recipient: { name: 'Jane Doe' },
          swift: undefined, // Adjust if there are additional fields in the actual transaction data
          branch: undefined,
          currency: undefined,
        },
      });
    });
  });
});
