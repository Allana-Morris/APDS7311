import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingStyles.css';

function LandingPageForm() {
  const navigate = useNavigate();

  const handleRoleSelection = (role) => {
    // Navigate based on the role selected
    navigate(role === 'Employee' ? '/Employee' : '/Registration');
  };

  return (
    <div className="landing-container">
      <h1 className="landing-title">Mars Banking</h1>
      <p className="landing-subtitle">Who's logging in?</p>
      
      <div className="role-selection">
        <div 
          className="role-box" 
          onClick={() => handleRoleSelection('Employee')}
        >
          Employee
        </div>
        
        <div 
          className="role-box" 
          onClick={() => handleRoleSelection('User')}
        >
          User
        </div>
      </div>
    </div>
  );
}

export default LandingPageForm;
