import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import Requests from './pages/Requests';
import { useAuthStore } from './store/auth';

export default function App() {
  const token = useAuthStore(s => s.token);
  return (
    <div className="container">
      <header className="header">
        <div className="brand">SlotSwapper</div>
        <nav className="nav">
          {token ? (
            <>
              <a href="/dashboard">Dashboard</a>
              <a href="/marketplace">Marketplace</a>
              <a href="/requests">Requests</a>
              <button className="ghost" onClick={() => useAuthStore.getState().logout()}>Logout</button>
            </>
          ) : (
            <>
              <a href="/login">Login</a>
              <a href="/signup">Signup</a>
            </>
          )}
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/marketplace" element={token ? <Marketplace /> : <Navigate to="/login" />} />
        <Route path="/requests" element={token ? <Requests /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}
