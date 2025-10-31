import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../components/LoadingSpinner/LoadingSpinner';

const Login = () => {
  const navigate = useNavigate();
  const { login, resendOTPCode } = useAuth();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (/\s/.test(newValue)) return;
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.usernameOrEmail) {
      newErrors.usernameOrEmail = 'Username or email is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await login(formData);
      if (res.message == "Please verify your email before logging in") {
        resendOTPCode({ email: res.userData.email, fullName: res.userData.fullName });
        navigate('/verify-email', { state: { email: res.userData.email, fullName: res.userData.fullName } });
        return
      }
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="rounded-lg p-8 shadow-lg" style={{
          backgroundColor: 'var(--color-card-background)',
          border: '1px solid var(--color-card-border)'
        }}>
          <div className='text-center mb-10'>
            <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Welcome back
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Sign in to your account to continue your learning journey
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="usernameOrEmail" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Username or Email
              </label>
              <input
                id="usernameOrEmail"
                name="usernameOrEmail"
                type="text"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                autoComplete='username'
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  borderColor: errors.usernameOrEmail ? 'var(--color-button-danger)' : 'var(--color-input-border)',
                  color: 'var(--color-text-primary)',
                  focusRingColor: 'var(--color-input-focus)'
                }}
                placeholder="Enter your username or email"
              />
              {errors.usernameOrEmail && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-error-text)' }}>
                  {errors.usernameOrEmail}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: 'var(--color-input-background)',
                    borderColor: errors.password ? 'var(--color-button-danger)' : 'var(--color-input-border)',
                    color: 'var(--color-text-primary)',
                    focusRingColor: 'var(--color-input-focus)'
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 pl-3 flex items-center"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-error-text)' }}>
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm hover:underline"
                style={{ color: 'var(--color-link)' }}
              >
                Forgot your password?
              </Link>
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
              {loading ? <LoadingSpinner size="small" text="" /> : 'Sign in'}
            </button>
              {errors.submit && (
              <div className="rounded-md p-4" style={{
                backgroundColor: 'var(--color-error-bg)',
                color: 'var(--color-error-text)'
              }}>
                <p className="text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium hover:underline"
                  style={{ color: 'var(--color-link)' }}
                >
                  Sign up
                </Link>
              </p>
            </div>
      
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;