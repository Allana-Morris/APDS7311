import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginStyle.css';

function LoginForm() {
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('cat');
    try {
      // Sends the login request to the backend
      const response = await fetch('http://localhost:3001/users/Login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountNumber: accountNumber, password: password }),
      });
      console.log('dog');
      const data = await response.json();

      if (response.ok) {
        console.log('bird');
        // Stores the JWT token in local storage
        localStorage.setItem('jwt', data.token);
       alert('Login successful!');
        
        // Navigates to the dashboard page after successful login
        navigate('/Home');
      } else {
        console.log('12');
        // Displays an error message if login failed
       alert('Login failed: ' + data.message);
      }
    } catch (error) {
     console.error('Error:', error);
     console.log('Error:', error);
     alert('Login error: ' + error.message);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login Form</h2>

        <label htmlFor="account-number">Account Number</label>
        <input
          type="text"
          id="account-number"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Account Number"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />

        <button type="submit">Log in</button>
      </form>
    </div>
  );
}

export default LoginForm;
