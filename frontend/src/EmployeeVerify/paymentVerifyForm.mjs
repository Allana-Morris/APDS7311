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
  });

  const [verifiedFields, setVerifiedFields] = useState({
    recipientName: false,
    recipientBank: false,
    accountNumber: false,
    swiftCode: false,
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      const { recipient, swift, transactionId } = location.state; // Get transactionId from location.state
      setFormData({
        recipientName: recipient?.name || '',
        recipientBank: recipient?.bank || '',
        accountNumber: recipient?.accountNumber || '',
        swiftCode: swift || '',
        transactionId: transactionId || '', // Set transactionId here
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
      } else {
        alert(`Error: ${data.message}`);
        setVerifiedFields((prevState) => ({ ...prevState, [field]: false }));
      }
    } catch (error) {
      console.error('Error verifying:', error);
      alert('An error occurred while verifying the information.');
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
        });
        setVerifiedFields({
          recipientName: false,
          recipientBank: false,
          accountNumber: false,
          swiftCode: false,
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
        {['recipientName', 'recipientBank', 'accountNumber', 'swiftCode'].map((field) => (
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
            />
            <button
              type="button"
              className="verify-btn"
              onClick={() => handleVerify(field)}
            >
              Verify
            </button>
          </div>
        ))}

        <div className="form-actions">
          <button type="submit" className="approve-btn" disabled={!allFieldsVerified}>Submit</button>
          <button type="button" className="reject-btn" onClick={handleReject}>Reject</button>
        </div>
      </form>
    </div>
  );
}

export default PaymentVerifyForm;
