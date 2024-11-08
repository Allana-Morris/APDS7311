import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EmpLoginStyle.css';

function EmpLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Sends the login request to the backend
      const response = await fetch('https://localhost:3001/users/employeeLogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      }); 

      const data = await response.json();

      if (response.ok) {
        // Stores the JWT token in local storage
        localStorage.setItem('jwt', data.token);
        alert('Login successful!');
        
        // Navigates to the dashboard page after successful login
        navigate('/EmployeeHome');
      } else {
        // Displays an error message if login failed
        alert('Login failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Login error: ' + error.message);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Employee Login</h2>

        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Employee Username"
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

export default EmpLoginForm;
