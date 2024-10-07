import logo from './logo.svg';
import './App.css';
import Reg from "./CustomerRegistration/RegistrationForm.mjs";
import Log from "./CustomerLogin/LoginForm.mjs"
import { Route, Routes, BrowserRouter } from "react-router-dom";  // Import BrowserRouter and Route

function App() {
  return (
    <div>
      {/* Wrap the Routes with BrowserRouter */}
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<Reg />} />
          <Route exact path="/login" element={<Log />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
