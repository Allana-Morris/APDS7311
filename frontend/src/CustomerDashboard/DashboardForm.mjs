import './DashboardStyle.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
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
          setTransactions(data.transactions || []);
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
    const isLocalPayment = transaction.type === 'local';
    const paymentPath = isLocalPayment ? '/LocalPayment' : '/InterPayment';

    navigate(paymentPath, {
      state: {
        amount: transaction.amount,
        recipient: transaction.recipient,
        swift: transaction.swift,
        branch: transaction.branch,
        currency: transaction.currency
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
          <button className="local-payment" onClick={handleLocalPaymentClick}>Make Local Payment</button>
          <button className="intl-payment" onClick={handleInternationalPaymentClick}>Make International Payment</button>
        </div>

        <div className="banking-details">
  <h3 className="banking-title">Banking Details</h3>
  <table className="banking-table">
    <thead>
      <tr>
        <th className="banking-heading"></th> {/* Empty header */}
        <th className="banking-heading">Current Acc</th>
        <th className="banking-heading">Acc No</th>
        <th className="banking-heading">Available Bal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="empty-cell"></td> {/* Empty cell to match the header */}
        <td></td>
        <td>{user.accountNumber}</td>
        <td>{`R${user.balance ? user.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ').replace('.', ',') : '0,00'}`}</td>
      </tr>
      <tr><td colSpan="4"></td></tr> {/* Empty row */}
    </tbody>
  </table>
</div>

        <h3>Payment Receipts</h3>
        <div className="payment-receipts">
          <table className="receipts-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Payer</th>
                <th>Recipient</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => {
                  const isPayer = transaction.sender === user.accountNumber;
                  const amount = parseFloat(transaction.amount);
                  const displayAmount = isPayer
                    ? `R${amount.toLocaleString('en-ZA', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).replace(/,/g, ' ').replace('.', ',')}`
                    : `+ R${amount.toLocaleString('en-ZA', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).replace(/,/g, ' ').replace('.', ',')}`;
                  const amountStyle = isPayer ? { color: 'red' } : { color: 'green' };
                  const isPending = !transaction.approved;

                  return (
                    <tr key={index}>
                      <td>{new Date(transaction.date).toLocaleDateString()}</td>
                      <td>{isPayer ? `${user.firstName} ${user.lastName}` : transaction.sender}</td>
                      <td>{transaction.recipient.name}</td>
                      <td style={amountStyle}>{displayAmount}</td>
                      <td>{isPending ? 'Pending' : 'Approved'}</td>
                      <td>
                        {isPayer && (
                          <button
                            className="pay-again-button"
                            onClick={() => handlePayAgain(transaction)}
                          >
                            Pay again
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;