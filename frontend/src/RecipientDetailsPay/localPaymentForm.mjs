import React, { useState } from 'react';
import './localPayment.css';

function LocalPaymentForm() {
  // Declare Variables
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientBank: '',
    accountNumber: '',
    amount: '',
    branch: '' // Change swiftCode to branch
  });

  // Get user input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { recipientName, recipientBank, accountNumber, amount, branch } = formData;

    // Data Validation. Can't leave any blank
    if (!recipientName || !recipientBank || !accountNumber || !amount || !branch) {
      alert('Please fill out all fields before proceeding.');
      return;
    }

    // Prepare data to send
    const paymentData = {
      type: 'local',
      recName: recipientName,
      recBank: recipientBank,
      recAccNo: accountNumber,
      amount: amount,
      branch: branch
    };

    try {
      // Send a POST request to the backend
      const response = await fetch('https://localhost:3001/users/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}` // Include JWT token for authentication
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Transaction successful: ${data.message}`);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert('An error occurred while processing your payment.');
    }
  };

  // Handle form reset
  const handleReset = () => {
    setFormData({
      recipientName: '',
      recipientBank: '',
      accountNumber: '',
      amount: '',
      branch: '' // Change swiftCode to branch
    });
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Local Payment Form</h2> {/* Title remains the same */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="recipientName">Recipient's Name:</label>
          <input
            type="text"
            id="recipientName"
            name="recipientName"
            value={formData.recipientName}
            onChange={handleChange}
            placeholder="Enter Recipient's Name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="recipientBank">Recipient's Bank:</label>
          <input
            type="text"
            id="recipientBank"
            name="recipientBank"
            value={formData.recipientBank}
            onChange={handleChange}
            placeholder="Enter Recipient's Bank"
          />
        </div>

        <div className="form-group">
          <label htmlFor="accountNumber">Recipient's Account No:</label>
          <input
            type="text"
            id="accountNumber"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            placeholder="Enter Recipient's Account No"
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount to Transfer:</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter Amount"
          />
        </div>

        <div className="form-group">
          <label htmlFor="branch">Enter Branch:</label> {/* Updated label */}
          <input
            type="text"
            id="branch"
            name="branch" // Change swiftCode to branch
            value={formData.branch}
            onChange={handleChange}
            placeholder="Enter Bank Branch"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="pay-btn">PAY Now</button>
          <button type="button" className="cancel-btn" onClick={handleReset}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default LocalPaymentForm;
