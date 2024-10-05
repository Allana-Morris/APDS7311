import React, { useState } from 'react';
import './LoginForm.css';

function LoginForm() {
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Send the login request to the backend
      const response = await fetch('http://localhost:3001/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountNumber, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the JWT token in local storage
        localStorage.setItem('jwt', data.token);
        alert('Login successful!');
      } else {
        // Display an error message if login failed
        alert('Login failed: ' + data);
      }
    } catch (error) {
      console.error('Error:', error);
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


/*
LoginForm.css

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.login-container {
  border-radius: 25px;
  padding: 20px;
  width: 300px;
  background-color: white;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border: 2px solid #E2B8A2;
}

.login-form h2 {
  text-align: center;
  border: 2px dashed green;
  padding: 5px;
  margin-bottom: 20px;
  color: #333;
}

.login-form label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: bold;
}

.login-form input {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.login-form button {
  width: 100%;
  padding: 10px;
  background-color: #2E576F;
  border: none;
  color: white;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
}

.login-form button:hover {
  background-color: #1F4056;
}

*/