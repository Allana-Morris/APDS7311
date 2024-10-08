import './DashboardStyle.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
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
        if (data.transactions) {
          fetchRecentTransactions(data.transactions); // Fetch recent transactions only if they exist
        }
      })
      .catch(err => console.error('Error fetching user data:', err));
    }
  }, []);

  const fetchRecentTransactions = (transactions) => {
    // Sort transactions by date and get the three most recent
    const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sortedTransactions.slice(0, 3).map(transaction => ({
      date: new Date(transaction.date).toLocaleDateString(), // Format the date to only show the date
      recipientName: transaction.recipient.name,
      transactionId: transaction.transactionId,
    }));
    setRecentTransactions(recent); // Set the recent transactions
  };
 
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
              <br></br>
            </tr>
            <tr>
              <td width={"10%"}></td>
            <td style={{fontWeight: 'bolder'}}>Current Acc</td>
            <td></td>
            <td></td>
            </tr>
            <tr>
            <td width={"10%"}></td>
              <td style={{fontWeight: 'bold'}}>Acc No:</td>
              <td></td>
              <td style={{fontWeight: 'bold'}}>Available Bal:</td>
            </tr>
            <tr>
            <td width={"10%"}></td>
            <td>{user.accountNumber}</td>
            <td></td>
            <td>{`R${user.balance ? user.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ').replace('.', ',') : '0,00'}`}</td>
            </tr>
            <tr>
              <br></br>
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
              <th>Recipient's Name</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <tr key={index}>
                  <td>{transaction.date}</td>
                  <td>{transaction.recipientName}</td>
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
