import './DashboardStyle.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      fetch('https://localhost:3001/users/Home', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      .then(response => response.json())
      .then(data => {
        setUser(data.user); //set the current user to the User signed in from response
        setTransactions(data.transactions || []); // Sets transactions for the current user from response
      })
      .catch(err => console.error('Error fetching user data:', err)); //Outputs error if if there is an error fetching from backend
    }
  }, []);

  if (!user) {
    return <p>Loading...</p>;
  }

  const handleLocalPaymentClick = () => {
    navigate('/LocalPayment');
  };

  const handleInternationalPaymentClick = () => {
    navigate('/InterPayment');
  };

  const handlePayAgain = (transaction) => {
    const isLocalPayment = transaction.type === 'local';
    const paymentPath = isLocalPayment ? '/LocalPayment' : '/InterPayment';

    navigate(paymentPath, {
      state: {
        amount: transaction.amount,
        recipient: transaction.recipient,
        swift: transaction.swift,
        branch: transaction.branch,
        currency: transaction.currency
      }
    });
  };

  return (
    <div className="container">
      <h1 className="dashboard-title">Customer Dashboard</h1>
      <h2 className="welcome-message">Hello, {user.firstName} {user.lastName}</h2>
      <br />
      <div className="dashboard-main">
        <div className="payment-buttons">
          <button className="local-payment" onClick={handleLocalPaymentClick}>Make Local Payment</button>
          <button className="intl-payment" onClick={handleInternationalPaymentClick}>Make International Payment</button>
        </div>

        <div className="banking-details">
          <h3 style={{ textAlign: 'center' }}>Banking Details</h3> {/*Display for the Account Details*/}
          <table className="banking-table">
            <tbody>
              <tr>
                <br />
              </tr>
              <tr>
                <td width={"10%"}></td>
                <td style={{ fontWeight: 'bolder' }}>Current Acc</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td width={"10%"}></td>
                <td style={{ fontWeight: 'bold' }}>Acc No:</td>
                <td></td>
                <td style={{ fontWeight: 'bold' }}>Available Bal:</td>
              </tr>
              <tr>
                <td width={"10%"}></td>
                <td>{user.accountNumber}</td>
                <td></td>
                <td>{`R${user.balance ? user.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ').replace('.', ',') : '0,00'}`}</td> {/*Converts the Database number into a Currency String in ZAR*/}
              </tr>
              <tr>
                <br />
              </tr>
            </tbody>
          </table>
        </div>

<h3>Payment Receipts</h3>
        <div className="payment-receipts" style={{ textAlign: 'center', overflowY: 'auto', maxHeight: '300px' }}> {/*Display for Payment Receipts*/}
          <table className="receipts-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{width: '20%'}} >Date</th>
                <th style={{width: '20%'}} >Payer</th>
                <th style={{width: '20%'}} >Recipient</th>
                <th style={{width: '20%'}} >Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => {
                  const isPayer = transaction.sender === user.accountNumber;
                  const amount = parseFloat(transaction.amount);
                  const displayAmount = isPayer ? `- R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ').replace('.', ',')}` 
                                                  : `+ R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, ' ').replace('.', ',')}`;
                  
                  const amountStyle = isPayer ? { color: 'red' } : { color: 'green' }; // Conditional styling for amount

                  return (
                    <tr key={index}>
                      <td>{new Date(transaction.date).toLocaleDateString()}</td> {/* Formats date */}
                      <td>{isPayer ? user.firstName + ' ' + user.lastName : transaction.sender}</td> {/* Shows payer's name */}
                      <td>{transaction.recipient.name}</td> {/* Accesses recipient's name */}
                      <td style={amountStyle}>{displayAmount}</td> {/* Applies conditional styles */}
                      <td>
                        {isPayer && (
                          <button className="pay-again-button" onClick={() => handlePayAgain(transaction)}>Pay again</button> )} {/*Pay Again Button*/}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No transactions found.</td> {/*Message that displays if there are no transaction done by the User*/}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <br></br>
      </div>
    </div>
  );
}

export default Dashboard;