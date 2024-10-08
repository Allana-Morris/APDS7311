import logo from './logo.svg';
import './App.css';
import Reg from "./CustomerRegistration/RegistrationForm.mjs";
import Log from "./CustomerLogin/LoginForm.mjs"
import Dash from "./dashbord/dashbordForm.mjs"
import InternationalPayment from "./RecipientDetailsPay/DetailsForm.mjs"
import LocalPayment from "./RecipientDetailsPay/localPaymentForm.mjs"

import { Route, Routes, BrowserRouter } from "react-router-dom";  // Import BrowserRouter and Route

function App() {
  return (
    <div>
      {/* Wrap the Routes with BrowserRouter */}
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<Reg />} />
          <Route exact path="/login" element={<Log />} />
          <Route exact path = "/dash" element={< Dash/>}/>
          <Route exact path = "/LocalPayment" element={< LocalPayment/>}/>
          <Route exact path = "/InterPayment" element={< InternationalPayment/>}/>

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
