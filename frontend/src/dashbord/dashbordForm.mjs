import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Customer Dashboard</h1>
        <h2>Hello, [Customer's Name]</h2>
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
            <button className="local-payment">Make Local Payment</button>
            <button className="intl-payment">Make International Payment</button>
          </div>
          
          <div className="banking-details">
            <h3>Banking Details</h3>
            <p>Current Acc: XXXXXXXXXXXX</p>
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
