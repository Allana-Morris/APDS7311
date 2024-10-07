import React, { useState } from 'react';
import './DetailsPayment.css';

function DetailsForm() {
  //-----------------------------------------------------------------------------------------------
  // Decalare Variables
  //-----------------------------------------------------------------------------------------------
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientBank: '',
    accountNumber: '',
    amount: '',
    swiftCode: ''
  });

//-----------------------------------------------------------------------------------------------
//Get user input
//-----------------------------------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const { recipientName, recipientBank, accountNumber, amount, swiftCode } = formData;

//-----------------------------------------------------------------------------------------------
//Data Validation.Can't leave any blank
//-----------------------------------------------------------------------------------------------
    if (!recipientName || !recipientBank || !accountNumber || !amount || !swiftCode) {
      alert('Please fill out all fields before proceeding.');
      return;
    }

    // PROCCESS
    alert(`Processing payment for ${recipientName} to ${recipientBank} for amount ${amount}.`);
  };

  // Handle form reset
  const handleReset = () => {
    setFormData({
      recipientName: '',
      recipientBank: '',
      accountNumber: '',
      amount: '',
      swiftCode: ''
    });
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

        <div className="form-actions">
          <button type="submit" className="pay-btn">PAY Now</button>
          <button type="button" className="cancel-btn" onClick={handleReset}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default DetailsForm;
