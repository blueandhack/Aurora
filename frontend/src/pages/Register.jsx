import React from 'react';
import { Link } from 'react-router-dom';

function Register() {
  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#6c757d' }}>
          Registration Disabled
        </h2>

        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          background: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
          <h3 style={{ color: '#6c757d', marginBottom: '1rem' }}>
            New User Registration Unavailable
          </h3>
          <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
            User registration is currently disabled. This system is restricted to existing users only.
          </p>
          <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
            If you need access, please contact your system administrator.
          </p>
        </div>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#e3f2fd',
          borderRadius: '4px',
          border: '1px solid #90caf9'
        }}>
          <p style={{
            textAlign: 'center',
            margin: 0,
            color: '#1976d2',
            fontSize: '0.9rem'
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: '#1976d2',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}>
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;