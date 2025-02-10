import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const username = localStorage.getItem('username');
  return username ? children : <Navigate to="/" replace />;
}