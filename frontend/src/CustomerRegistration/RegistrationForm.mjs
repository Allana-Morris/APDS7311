// src/components/CustomerRegistration/RegistrationForm.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Link } from 'react-router-dom';
import './RegisterStyles.css'; // Import the CSS file

function RegistrationForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      // Send the registration request to the backend
      console.log("henlo")
      const response = await fetch('https://localhost:3001/users/register', {
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
          idNumber 
        }),
      });

      console.log("benlo")


      const data = await response.json();

      console.log("menlo")
      if (response.ok) {
        alert('Registration successful!');
        // Redirect to the login page after successful registration
        navigate('/login'); // Use navigate to redirect
      } else {
        // Display an error message if registration failed
        // Access the error message from the data object
        const errorMessage = data.errorMessage;
        alert('Registration failed: ' + errorMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Registration error: ' + error.message);
    }
  };

  return (
    <form className="registration-form" onSubmit={handleSubmit}>
      <h2>Customer Registration Form</h2>
      <div className="form-row">
        <input
          className="form-input"
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
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
        <input
          className="form-input"
          type="text"
          placeholder="ID Number"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          required
        />
      </div>
      <button className="submit-button" type="submit">Submit</button>
      <div>
        
      </div>
      <div><Link to="/login">
          An existing customer? Click to Login
        </Link>
    </div>
    </form>
  );
}

export default RegistrationForm;
