// src/components/CustomerRegistration/RegistrationForm.js

import React from 'react';
import { styles } from './styles';

function RegistrationForm() {
  return (
    <form style={styles.form}>
      <div style={styles.row}>
        <input style={styles.input} type="text" placeholder="First Name" />
        <input style={styles.input} type="text" placeholder="Last Name" />
      </div>
      <div style={styles.row}>
        <input style={styles.input} type="email" placeholder="Email Address" />
      </div>
      <div style={styles.row}>
        <input style={styles.input} type="password" placeholder="Password" />
        <input style={styles.input} type="password" placeholder="Confirm Password" />
      </div>
      <div style={styles.row}>
        <input style={styles.input} type="text" placeholder="Account Number" />
        <input style={styles.input} type="text" placeholder="ID Number" />
      </div>
      <button style={styles.submitButton} type="submit">Submit</button>
    </form>
  );
}

export default RegistrationForm;
