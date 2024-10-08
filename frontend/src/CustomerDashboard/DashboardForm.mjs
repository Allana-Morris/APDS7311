import './DashboardStyle.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
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

  return (
    <div className="container">
        <h1 className="dashboard-title">Customer Dashboard</h1>
        <h2 className="welcome-message">Hello, {user.firstName} {user.lastName}</h2>
        
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
            <td>Current Acc</td>
            </tr>
            <tr>
              <td>Acc No:</td>
              <td>{user.accountNumber}</td>
              <td style={{ width: '20%' }}></td> 
              <td>Available Bal:</td>
              <td>{`R ${user.balance ? user.balance.toFixed(2) : '0.00'}`}</td>
            </tr>
          </tbody>
        </table>
</div>

<div className="payment-receipts" style={{ textAlign: 'center' }}>
        <h3>Payment Receipts</h3>
        <table className="receipts-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Details</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((transaction, index) => (
                <tr key={index}>
                  <td>{transaction.date}</td>
                  <td>{transaction.details}</td>
                  <td>
                    <button className="pay-again-button">Pay again</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center' }}>No transactions found.</td>
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
