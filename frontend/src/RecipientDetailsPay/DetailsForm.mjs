import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './DetailsPayment.css';

function DetailsForm() {
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientBank: '',
    accountNumber: '',
    amount: '',
    swiftCode: '',
    currency: 'USD' // Default currency set to USD
  });

  const navigate = useNavigate(); // Initializes useNavigate for redirecting
  const location = useLocation(); // Initializes useLocation to access passed state

  // Autofill form fields if there's data in location.state
  useEffect(() => {
    if (location.state) {
      const { amount, recipient, swift, currency } = location.state;
      setFormData({
        recipientName: recipient.name || '',
        recipientBank: recipient.bank || '',
        accountNumber: recipient.accountNumber || '',
        amount: amount || '',
        swiftCode: swift, // Sets SWIFT code to empty
        currency: currency // Keeps default currency
      });
    }
  }, [location.state]); // Runs this effect when location.state changes

  // Gets user input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { recipientName, recipientBank, accountNumber, amount, swiftCode, currency } = formData;

    // Data Validation.
    if (!recipientName || !recipientBank || !accountNumber || !amount || !swiftCode || !currency) {
      alert('Please fill out all fields before proceeding.');
      return;
    }

    // Prepares the request body for the international payment
    const paymentData = {
      type: 'international',
      recName: recipientName,
      recBank: recipientBank,
      recAccNo: accountNumber,
      amount: amount,
      swift: swiftCode,
      currency: currency
    };

    try {
      // Gets the token from localStorage
      const token = localStorage.getItem('jwt');

      // Makes the POST request to the backend
      const response = await fetch('https://localhost:3001/users/Payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Includes JWT token for authentication
        },
        body: JSON.stringify(paymentData)
      });

      // Handles the response from the server
      const result = await response.json();
      if (response.ok) {
        alert(`Transaction successful: ${result.message}`);
        navigate('/Home'); // Navigates to the dashboard after successful payment
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('There was an error processing the payment. Please try again.');
    }
  };

  // Handles form reset and navigate to dashboard
  const handleReset = () => {
    setFormData({
      recipientName: '',
      recipientBank: '',
      accountNumber: '',
      amount: '',
      swiftCode: '',
      currency: 'USD' // Resets currency to default
    });

    navigate('/home'); // Redirects to /home when cancel is clicked
  };

  return (
    <div className="form-container">
      <h2 className="form-title">International Payment Form</h2>
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
          <label htmlFor="swiftCode">Enter SWIFT Code:</label>
          <input
            type="text"
            id="swiftCode"
            name="swiftCode"
            value={formData.swiftCode}
            onChange={handleChange}
            placeholder="Enter Bank SWIFT Code"
          />
        </div>

        {/* Currency Selection Combo Box */}
        <div className="form-group">
          <label htmlFor="currency">Currency:</label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="CNY">CNY - Chinese Yuan</option>
            <option value="INR">INR - Indian Rupee</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="pay-btn">PAY Now</button>
          <button type="button" className="cancel-btn" onClick={handleReset}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default DetailsForm;
