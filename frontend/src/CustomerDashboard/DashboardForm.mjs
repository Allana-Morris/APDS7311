import './DashboardStyle.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]); // State to store transactions
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      fetch('https://localhost:3001/users/Home', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      .then(response => response.json())
      .then(data => {
        setUser(data.user);
        setTransactions(data.transactions || []); // Set transactions from response
      })
      .catch(err => console.error('Error fetching user data:', err));
    }
  }, []);

  if (!user) {
    return <p>Loading...</p>;
  }

  const handleLocalPaymentClick = () => {
    navigate('/LocalPayment');
  };

  const handleInternationalPaymentClick = () => {
    navigate('/InterPayment');
  };

  const handlePayAgain = (transaction) => {
    // Determine payment type (you can adjust this logic based on your needs)
    const isLocalPayment = transaction.type === 'local'; // Assuming you have a type field in your transaction
    const paymentPath = isLocalPayment ? '/LocalPayment' : '/InterPayment';

    // Navigate to the payment screen and pass transaction data
    navigate(paymentPath, {
      state: {
        amount: transaction.amount,
        recipient: transaction.recipient,
        swift: transaction.swift,
        branch: transaction.branch,
        currency: transaction.currency
        // Add any other fields you need to autofill
      }
    });
  };

  return (
    <div className="container">
      <h1 className="dashboard-title">Customer Dashboard</h1>
      <h2 className="welcome-message">Hello, {user.firstName} {user.lastName}</h2>
      <br />
      <div className="dashboard-main">
        <div className="payment-buttons">
          <button className="local-payment" onClick={handleLocalPaymentClick}>
            Make Local Payment
          </button>
          <button className="intl-payment" onClick={handleInternationalPaymentClick}>
            Make International Payment
          </button>
        </div>

        <div className="banking-details">
          <h3 style={{ textAlign: 'center' }}>Banking Details</h3>
          <table className="banking-table">
            <tbody>
              <tr>
                <br />
              </tr>
              <tr>
                <td width={"10%"}></td>
                <td style={{ fontWeight: 'bolder' }}>Current Acc</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td width={"10%"}></td>
                <td style={{ fontWeight: 'bold' }}>Acc No:</td>
                <td></td>
                <td style={{ fontWeight: 'bold' }}>Available Bal:</td>
              </tr>
              <tr>
                <td width={"10%"}></td>
                <td>{user.accountNumber}</td>
                <td></td>
                <td>{`R${user.balance ? user.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ').replace('.', ',') : '0,00'}`}</td>
              </tr>
              <tr>
                <br />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="payment-receipts" style={{ textAlign: 'center', overflowY: 'auto', maxHeight: '300px' }}> {/* Add scrolling */}
          <h3>Payment Receipts</h3>
          <table className="receipts-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Payer</th>
                <th>Recipient</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => {
                  const isPayer = transaction.sender === user.accountNumber;
                  const amount = parseFloat(transaction.amount);
                  const displayAmount = isPayer ? `- R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ').replace('.', ',')}` 
                                                  : `+ R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ').replace('.', ',')}`;
                  
                  const amountStyle = isPayer ? { color: 'red' } : { color: 'green' }; // Conditional styling for amount

                  return (
                    <tr key={index}>
                      <td>{new Date(transaction.date).toLocaleDateString()}</td> {/* Format date */}
                      <td>{isPayer ? user.firstName + ' ' + user.lastName : transaction.sender}</td> {/* Show payer's name */}
                      <td>{transaction.recipient.name}</td> {/* Access recipient's name */}
                      <td style={amountStyle}>{displayAmount}</td> {/* Apply conditional styles */}
                      <td>
                        {isPayer && (
                          <button className="pay-again-button" onClick={() => handlePayAgain(transaction)}>Pay again</button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
