import './Dashboard.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      fetch('https://localhost:3001/users/dash', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      .then(response => response.json())
      .then(data => {
        setUser(data.user); // Set the fetched user data
      })
      .catch(err => console.error('Error fetching user data:', err));
    }
  }, []);

  if (!user) {
    return <p>Loading...</p>;
  }

  const handleLocalPaymentClick = () => {
    navigate('/payment'); // Navigate to /payment when button is clicked
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Customer Dashboard</h1>
        {/* Display the user's first and last name here */}
        <h2>Hello, {user.firstName} {user.lastName}</h2>
      </header>
      
      <div className="dashboard-body">
        <div className="side-menu">
          <h3>Menu</h3>
          <ul>
            <li>Transactions</li>
            <li>Payments</li>
          </ul>
        </div>
        
        <div className="dashboard-main">
          <div className="payment-buttons">
            <button className="local-payment" onClick={handleLocalPaymentClick}>
              Make Local Payment
            </button>
            <button className="intl-payment">Make International Payment</button>
          </div>
          
          <div className="banking-details">
            <h3>Banking Details</h3>
            <p>Current Acc: {user.accountNumber}</p>
            <p>Available Balance: $1500.00</p>
          </div>

          <div className="payment-receipts">
            <h3>Payment Receipts</h3>
            <div className="receipt">
              <p>2024/08/20 - Sch Fees - $200</p>
              <button>Pay again</button>
            </div>
            <div className="receipt">
              <p>2024/08/20 - Home R - $100</p>
              <button>Pay again</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
