import './App.css';
import Reg from "./CustomerRegistration/RegistrationForm.mjs";
import Log from "./CustomerLogin/LoginForm.mjs"
import Dash from "./CustomerDashboard/DashboardForm.mjs"
import InternationalPayment from "./RecipientDetailsPay/DetailsForm.mjs"
import LocalPayment from "./RecipientDetailsPay/localPaymentForm.mjs"
//part 3
import EmpLog from "./EmployeeLogin/EmpLoginForm.mjs"
import EmpDash from "./EmployeeDashBoard/EmpDashboardForm.mjs"
import Verify from "./EmployeeVerify/paymentVerifyForm.mjs"

import { Route, Routes, BrowserRouter } from "react-router-dom";  // Import BrowserRouter and Route

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<Reg />} />
          <Route exact path="/Login" element={<Log />} />
          <Route exact path = "/Home" element={< Dash/>}/>
          <Route exact path = "/LocalPayment" element={< LocalPayment/>}/>
          <Route exact path = "/InterPayment" element={< InternationalPayment/>}/>
          
          <Route exact path="/Employee" element={<EmpLog />} />
          <Route exact path = "/EmployeeHome" element={< EmpDash/>}/>
          <Route exact path = "/verifyPay" element={< Verify/>}/>




        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
