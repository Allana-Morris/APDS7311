// src/components/CustomerRegistration/CustomerRegistration.js

import React from 'react';
import RegistrationForm from './RegistrationForm';
import { styles } from './styles';

function CustomerRegistration() {
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Customer Registration Form</h2>
      <RegistrationForm />
      <div style={styles.loginLinkContainer}>
        <a href="/login" style={styles.loginLink}>An existing customer? Click to Login</a>
      </div>
    </div>
  );
}

export default CustomerRegistration;
