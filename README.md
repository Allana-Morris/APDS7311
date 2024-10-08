# Customer International Payments Portal

This project is part of the APDS7311 POE, Part 2. It involves creating a secure web-based portal and API for customers to make international payments via an internal bank system. The application ensures high security standards and protects sensitive data.

## Technologies Used
- **Frontend**: React
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Security Libraries**: bcrypt, helmet, express-rate-limit
- **Other Tools**: SSL, OBS for recording

## Features

### Security Implementations
1. **Password Security**:
   - Passwords are hashed and salted using bcrypt to prevent plain-text storage.
   
2. **Input Whitelisting**:
   - All user inputs are sanitized and validated using regular expressions to prevent injection attacks.
   
3. **Data Protection**:
   - The entire application operates over HTTPS, ensuring all data in transit is encrypted with SSL.

4. **Attack Prevention**:
   - Protections are implemented against various types of attacks, including:
     - SQL Injection
     - Cross-Site Scripting (XSS)
     - Clickjacking
     - Session Hijacking
     - Distributed Denial of Service (DDoS)

### API Endpoints
- **POST /register** - Register a new customer
- **POST /login** - Login to the customer portal
- **POST /payment** - Make a new international payment
- **GET /transactions** - View previous transactions (secure access required)

## Video Demonstration
A demonstration video of the application in use is available on YouTube [Unlisted Link].

## Setup and Installation

### Prerequisites
- Node.js and npm
- MongoDB 
- OBS Studio (for recording a video demonstration)
- SSL certificate

### Installation Steps
1. Clone the repository:
   ```bash
   git clone 
   cd
