// src/components/CustomerRegistration/RegistrationForm.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Link } from 'react-router-dom';
import './RegisterStyles.css'; // Import the CSS file

const RegistrationForm = () => {

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [error, setError] = useState(null); // State for error messages
  const navigate = useNavigate(); // Initialize useNavigate

  // Validation patterns
  const namePattern = /^[a-zA-Z\s-]+$/; // Allows letters, spaces, and hyphens
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|co\.za)$/; // Valid email format
  const accountNumberPattern = /^\d{6,11}$/; // South African bank account number validation
  const southAfricanIDPattern = /^(?!000000)(\d{2})(\d{2})(\d{2})(\d{4})([01])(\d)(\d)$/; // SA ID validation
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/; // Password validation

  const handleSubmit = async (e) => {
      e.preventDefault(); // Prevents the default form submission

      // Input validation
      if (!namePattern.test(firstName) || !namePattern.test(lastName)) {
          setError('Invalid name. Only letters, spaces, and hyphens are allowed.');
          return;
      }

      if (!emailPattern.test(email)) {
          setError('Invalid email format. Please use a valid email.');
          return;
      }

      if (!accountNumberPattern.test(accountNumber)) {
          setError('Invalid bank account number. It should be between 6 and 11 digits.');
          return;
      }

      if (!southAfricanIDPattern.test(idNumber)) {
          setError('Invalid South African ID number.');
          return;
      }

      if (!passwordPattern.test(password)) {
          setError('Password must be at least 12 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
          return;
      }

      if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
      }

       setError(null); // Clear any previous error

      try {
          const response = await fetch('https://localhost:3001/users/', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  firstName,
                  lastName,
                  email,
                  password,
                  confirmPassword,
                  accountNumber,
                  idNumber,
              }),
          });

          const data = await response.json();

          if (response.ok) {
              alert('Registration successful!');
              navigate('/Login'); // Uses navigate to redirect
          } else {
              const errorMessage = data.message || 'Registration failed. Please try again.'; 
               alert('Registration failed: ' + errorMessage);
          }
      } catch (error) {
          console.error('Error:', error);
          alert('Registration error: ' + error.message);
      }
  };

  return (
    <form className="registration-form" onSubmit={handleSubmit}>
      <h2 className='customer-heading'>Customer Registration Form</h2>
      {error && <div className="error-message">{error}</div>} {/* Display error messages */}
      <div className="form-fields">
      <br></br>
      <div className="form-row">
        <input
          className="form-input"
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <div>&nbsp;&nbsp;&nbsp;&nbsp;</div>
        <input
          className="form-input"
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <input
          className="form-input"
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <input
          className="form-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div>&nbsp;&nbsp;&nbsp;&nbsp;</div>
        <input
          className="form-input"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <input
          className="form-input"
          type="text"
          placeholder="Account Number"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          required
        />
        <div>&nbsp;&nbsp;&nbsp;&nbsp;</div>
        <input
          className="form-input"
          type="text"
          placeholder="ID Number"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          required
        />
        <div>
        <br>
        </br>
      </div>
      </div>
      <button className="submit-button" type="submit">Submit</button>
      <div>
        <br>
        
        </br>
      </div>
      </div>
      <div className="align-right">
      An existing customer?{' '}
  <Link className="redirect-login" to="/Login">
    Click to Login
  </Link>
</div>
    </form>
    
  );
}

export default RegistrationForm;
