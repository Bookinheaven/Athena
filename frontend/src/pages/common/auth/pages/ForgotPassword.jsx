import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../../contexts/AuthContext';
import { validateEmail } from '../../../../utils/validation';
import LoadingSpinner from '../../../../components/LoadingSpinner/LoadingSpinner';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              🧠 Athena
            </h1>
            <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              Smart Study Tracking with Pattern Intelligence
            </p>
          </div>

          <div className="rounded-lg p-8 shadow-lg text-center" style={{
            backgroundColor: 'var(--color-card-background)',
            border: '1px solid var(--color-card-border)'
          }}>
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Check your email
            </h2>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              We've sent a password reset code to <strong>{email}</strong>
            </p>
            <button
              onClick={() => navigate('/reset-password', { state: { email } })}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              style={{
                backgroundColor: 'var(--color-button-primary)',
                color: 'var(--color-button-primary-text)',
                focusRingColor: 'var(--color-button-primary)'
              }}
            >
              Continue to Reset Password
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        </div>

        <div className="rounded-lg p-8 shadow-lg" style={{
          backgroundColor: 'var(--color-card-background)',
          border: '1px solid var(--color-card-border)'
        }}>
          <div className="text-center pb-3">
            <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No worries! Enter your email and we'll send you a reset code
            </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md p-4" style={{
                backgroundColor: 'var(--color-error-bg)',
                color: 'var(--color-error-text)'
              }}>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  borderColor: 'var(--color-input-border)',
                  color: 'var(--color-text-primary)',
                  focusRingColor: 'var(--color-input-focus)'
                }}
                placeholder="Enter your email address"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-button-primary)',
                color: 'var(--color-button-primary-text)',
                focusRingColor: 'var(--color-button-primary)'
              }}
            >
              {loading ? <LoadingSpinner size="small" text="" /> : 'Send Reset Code'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm hover:underline"
                style={{ color: 'var(--color-link)' }}
              >
                ← Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;