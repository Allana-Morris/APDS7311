import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './RegisterStyles.css';

const RegistrationForm = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userName, setUsername] = useState(''); // New username state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Validation patterns
  const namePattern = /^[a-zA-Z\s-]+$/; // Allows letters, spaces, and hyphens
  const usernamePattern = /^[a-zA-Z0-9_-]{3,15}$/; // Allows letters, numbers, underscores, hyphens; 3-15 chars
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|co\.za)$/; // Valid email format
  const accountNumberPattern = /^\d{6,11}$/; // South African bank account number validation
  const southAfricanIDPattern = /^(?!000000)(\d{2})(\d{2})(\d{2})(\d{4})([01])(\d)(\d)$/; // SA ID validation
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/; // Password validation

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Input validation
    if (!namePattern.test(firstName) || !namePattern.test(lastName)) {
      setError('Invalid name. Only letters, spaces, and hyphens are allowed.');
      return;
    }

    if (!usernamePattern.test(userName)) {
      setError('Invalid username. It should be 3-15 characters and can only include letters, numbers, underscores, and hyphens.');
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

    setError(null);

    try {
      alert(userName)
      const response = await fetch('https://localhost:3001/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          userName, // Add username to the POST request
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
        setFirstName('');
        setLastName('');
        setUsername(''); 
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setAccountNumber('');
        setIdNumber('');
        navigate('/Login');
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
    <div>
      <Helmet>
        <title>Register - Mars Portal</title>
        <meta name="description" content="Create a new account for Mars Portal." />
      </Helmet>
      <form className="registration-form" onSubmit={handleSubmit}>
        <h2 className="customer-heading">Customer Registration</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-fields">
          <br />
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
              type="text"
              placeholder="Username"
              value={userName}
              onChange={(e) => setUsername(e.target.value)}
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
              <br />
            </div>
          </div>
          <button className="submit-button" type="submit" onSubmit={handleSubmit}>Submit</button>
          <div>
            <br />
          </div>
        </div>
        <div className="align-right">
          An existing customer?{' '}
          <Link className="redirect-login" to="/Login">
            Click to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
