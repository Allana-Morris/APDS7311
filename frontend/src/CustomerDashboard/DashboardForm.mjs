import './DashboardStyle.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

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
        setUser(data.user); // Set the fetched user data including balance
      })
      .catch(err => console.error('Error fetching user data:', err));
    }
  }, []);

  if (!user) {
    return <p>Loading...</p>;
  }

  const handleLocalPaymentClick = () => {
    navigate('/LocalPayment'); // Navigate to /LocalPayment when button is clicked
  };

  const handleInternationalPaymentClick = () => {
    navigate('/InterPayment'); // Navigate to /InternationalPayment when button is clicked
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Customer Dashboard</h1>
        <br></br>
        <h2>Hello, {user.firstName} {user.lastName}</h2>
      </header>
      
      <div className="dashboard-body">
        <div className="side-menu">
         { /* <h3>Menu</h3>
          <ul> 
            <li>Transactions</li>
            <li>Payments</li>
          </ul> */}
        </div>
        
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
            <h3>Banking Details</h3>
            <p>Current Acc: {user.accountNumber}</p>
            {/* Display the available balance from the backend */}
            <p>Available Balance: R{user.balance.toFixed(2)}</p>
          </div>

          <div className="payment-receipts">
            <h3>Payment Receipts</h3>
            <div className="receipt">
              
            </div>
            <div className="receipt">
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
