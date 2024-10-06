// src/App.js

import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import CustomerRegistration from './components/CustomerRegistration';
import LoginForm from './components/CustomerLogin'; // Adjust if your file structure differs

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerRegistration />} />
        <Route path="/login" element={<LoginForm />} />
      </Routes>
    </Router>
  );
}

export default App;
