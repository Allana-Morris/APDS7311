// src/components/CustomerRegistration/CustomerRegistration.js

import React from 'react';
import { Link } from 'react-router-dom';
import RegistrationForm from './RegistrationForm';
import { styles } from './RegisterStyles.css';

function CustomerRegistration() {
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Customer Registration Form</h2>
      <RegistrationForm />
      <Link to="/login" style={styles.loginLink}>
          An existing customer? Click to Login
        </Link>
    </div>
  );
}

export default CustomerRegistration;
