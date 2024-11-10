import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PaymentVerifyStyles.css';

function PaymentVerifyForm() {
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientBank: '',
    accountNumber: '',
    swiftCode: '',
    transactionId: '', // Initialize transactionId here
    transactionAmount: '', // New field for transaction amount
    sender: ''
  });

  const [verifiedFields, setVerifiedFields] = useState({
    recipientName: false,
    recipientBank: false,
    accountNumber: false,
    swiftCode: false,
    transactionAmount: false, // Add a field for transaction amount verification
  });

  const [accountVerified, setAccountVerified] = useState(false); // Track if account is verified
  const [paymentVerified, setPaymentVerified] = useState(false); // Track if payment is verified

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      const { recipient, swift, transactionId, amount, sender } = location.state; // Get transactionId and amount from location.state
      setFormData({
        recipientName: recipient?.name || '',
        recipientBank: recipient?.bank || '',
        accountNumber: recipient?.accountNumber || '',
        swiftCode: swift || '',
        transactionId: transactionId || '', // Set transactionId here
        transactionAmount: amount || '', // Set transaction amount
        sender: sender || ''
      });
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleVerify = async (field) => {
    try {
      const queryParams = new URLSearchParams({
        field: field,
        recipientName: formData.recipientName,
        recipientBank: formData.recipientBank,
        accountNumber: formData.accountNumber,
        swiftCode: formData.swiftCode,
        transactionAmount : formData.transactionAmount,
        sender : formData.sender
      });

      const response = await fetch(`https://localhost:3001/users/verify?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Verification successful: ${data.message}`);
        setVerifiedFields((prevState) => ({ ...prevState, [field]: true }));
        if (field === 'accountNumber') {
          setAccountVerified(true); // Set account verified to true when account is verified
        }
      } else {
        alert(`Error: ${data.message}`);
        setVerifiedFields((prevState) => ({ ...prevState, [field]: false }));
      }
    } catch (error) {
      console.error('Error verifying:', error);
      alert('An error occurred while verifying the information.');
    }
  };

  const handleVerifyPayment = async () => {
    try {
      const response = await fetch(`https://localhost:3001/users/verifyPayment?transactionId=${formData.transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Payment verification successful: ${data.message}`);
        setPaymentVerified(true); // Set payment as verified
      } else {
        alert(`Error verifying payment: ${data.message}`);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('An error occurred while verifying the payment.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://localhost:3001/users/ProcessPay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Payment processing successful!");
        navigate("/employeeHome");
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("An error occurred while processing the payment.");
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch('https://localhost:3001/users/rejectPay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`, // Include JWT for authentication
        },
        body: JSON.stringify(formData), // Send transactionId for rejection
      });

      const data = await response.json();

      if (response.ok) {
        alert('Transaction rejected successfully!');

        // Reset form fields after successful rejection
        setFormData({
          recipientName: '',
          recipientBank: '',
          accountNumber: '',
          swiftCode: '',
          transactionId: '', // Reset transactionId on reject
          transactionAmount: '', // Reset transactionAmount
        });
        setVerifiedFields({
          recipientName: false,
          recipientBank: false,
          accountNumber: false,
          swiftCode: false,
          transactionAmount: false, // Reset verification for transactionAmount
        });

        // Navigate to the home page
        navigate('/home');
      } else {
        alert(`Error rejecting transaction: ${data.message}`);
      }
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      alert('An error occurred while rejecting the transaction.');
    }
  };

  const allFieldsVerified = Object.values(verifiedFields).every(Boolean);

  return (
    <div className="form-container">
      <h2 className="form-title">Bank Employee Verification</h2>
      <form onSubmit={handleSubmit}>
        {/* Verify Account Button first */}
        <div className="form-group">
          <label htmlFor="accountNumber">Enter Account Number:</label>
          <input
            type="text"
            id="accountNumber"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            placeholder="Enter Account Number"
            style={{ color: verifiedFields.accountNumber ? 'green' : 'black' }}
          />
          <button
            type="button"
            className="verify-btn"
            onClick={() => handleVerify('accountNumber')}
          >
            Verify Account
          </button>
        </div>

        {/* Other fields, but disabled until account number is verified */}
        {['recipientName', 'recipientBank', 'swiftCode'].map((field) => (
          <div className="form-group" key={field}>
            <label htmlFor={field}>Enter {field.replace(/([A-Z])/g, ' $1')}:</label>
            <input
              type="text"
              id={field}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1')}`}
              style={{ color: verifiedFields[field] ? 'green' : 'black' }}
              disabled={!accountVerified} // Disable until account is verified
            />
            <button
              type="button"
              className="verify-btn"
              onClick={() => handleVerify(field)}
              disabled={!accountVerified} // Disable verify button until account is verified
            >
              Verify
            </button>
          </div>
        ))}

        {/* Verify Payment Section */}
        <div className="form-group">
          <label htmlFor="transactionAmount">Transaction Amount: </label>
          <input
            type="text"
            id="transactionAmount"
            name="transactionAmount"
            value={formData.transactionAmount}
            onChange={handleChange}
            placeholder="Enter transaction amount"
            style={{ color: verifiedFields.transactionAmount ? 'green' : 'black' }}
            disabled={!accountVerified} // Disable until account is verified
          />
          <button
            type="button"
            className="verify-btn"
            onClick={() => handleVerify('transactionAmount')}
            disabled={!accountVerified} // Disable until account is verified
          >
            Verify Transaction Amount
          </button>
        </div>

        {/* Verify Payment Button */}
        <div className="form-actions">
          <button type="submit" className="approve-btn" disabled={!allFieldsVerified}>Submit</button>
          <button type="button" className="reject-btn" onClick={handleReject}>Reject</button>
        </div>
      </form>
    </div>
  );
}

export default PaymentVerifyForm;
