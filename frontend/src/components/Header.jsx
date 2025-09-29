import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Header() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <header style={{ 
      background: '#fff', 
      borderBottom: '1px solid #ddd', 
      padding: '1rem 0',
      marginBottom: '2rem'
    }}>
      <div className="container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div>
          <Link 
            to="/" 
            style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              textDecoration: 'none',
              color: '#333'
            }}
          >
            🌟 Aurora AI Assistant
          </Link>
        </div>
        
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <>
              {isAdmin() && (
                <Link 
                  to="/admin" 
                  className="btn btn-primary"
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '14px',
                    marginRight: '1rem',
                    background: '#dc3545',
                    borderColor: '#dc3545'
                  }}
                >
                  🔧 Admin
                </Link>
              )}
              <span style={{ color: '#666' }}>
                Welcome, {user.username}
                {isAdmin() && <span style={{ color: '#dc3545', fontWeight: 'bold' }}> (Admin)</span>}
              </span>
              <button 
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Logout
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              {location.pathname !== '/login' && (
                <Link to="/login" className="btn btn-primary">
                  Login
                </Link>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;