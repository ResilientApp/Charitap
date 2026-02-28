import React from 'react';
import ReactDOM from 'react-dom/client';
// Removed Auth0; using custom AuthProvider backed by Firebase Auth
import { AuthProvider } from './auth/AuthContext';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/main.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastIcon = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={20} className="text-[#626F47]" />;
    case 'error':
      return <AlertCircle size={20} className="text-[#D9534F]" />;
    case 'warning':
      return <AlertTriangle size={20} className="text-[#F0BB78]" />;
    case 'info':
      return <Info size={20} className="text-[#626F47]" />;
    default:
      return null;
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <App />
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Slide}
        icon={ToastIcon}
      />
    </AuthProvider>
  </React.StrictMode>
);
