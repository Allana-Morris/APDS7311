import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EmpDashboardStyle.css';

function EmpDashboard() {
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      fetch('https://localhost:3001/users/employeeHome', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(response => response.json())
      .then(data => {
        setTransactions(data.transactions || []);
      })
      .catch(err => console.error('Error fetching transactions:', err));
    }
  }, []);

  const handleApproveTransaction = (transaction) => {
    // Navigate to verifyPayment page with transaction data
    navigate('/verifyPay', { state: transaction });
  };

  return (
    <div className="container">
      <h1 className="dashboard-title">Employee Dashboard</h1>
      <h3>Unapproved Transactions</h3>
      <div className="payment-receipts" style={{ textAlign: 'center', overflowY: 'auto', maxHeight: '300px' }}>
        <table className="receipts-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Date</th>
              <th style={{ width: '20%' }}>Payer</th>
              <th style={{ width: '20%' }}>Recipient</th>
              <th style={{ width: '20%' }}>Amount</th>
              <th style={{ width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((transaction, index) => {
                const amount = parseFloat(transaction.amount);
                const displayAmount = `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ').replace('.', ',')}`;

                return (
                  <tr key={index}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.sender}</td>
                    <td>{transaction.recipient.name}</td>
                    <td>{displayAmount}</td>
                    <td>
                      <button
                        className="approve-button"
                        onClick={() => handleApproveTransaction(transaction)}
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No unapproved transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmpDashboard;
