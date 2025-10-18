import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../../contexts/AuthContext';
import LoadingSpinner from '../../../../components/LoadingSpinner/LoadingSpinner';

const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail, resendOTPCode } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fullName = location.state?.fullName;
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleChange = (element, index) => {
    const value = element.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    if (!/^\d{6}$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    setOtp(newOtp);

    const inputs = document.querySelectorAll('input[type="text"]');
    if (inputs[5]) inputs[5].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyEmail(email, otpString);
      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(error.message);
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
           {error && (
            <div className="mb-4 rounded-md p-4" style={{
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error-text)'
            }}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md p-4" style={{
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success-text)'
            }}>
              <p className="text-sm">{success}</p>
            </div>
          )}

          <div className="text-center select-none md-4">
            <h2 className="text-3xl font-bold select-none" style={{ color: 'var(--color-text-primary)' }}>
              Verify your email
            </h2>
            <p className="mt-2 text-sm select-none" style={{ color: 'var(--color-text-secondary)' }}>
              We've sent a 6-digit verification code to
            </p>
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {email}
            </p>
          </div>


          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-4 text-center select-none" style={{ color: 'var(--color-text-primary)' }}>
                Enter verification code
              </label>
              <div className="flex justify-center space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={(e) => handlePaste(e)}
                    className="w-12 h-12 text-center text-lg font-bold border rounded-md focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      backgroundColor: 'var(--color-input-background)',
                      borderColor: 'var(--color-input-border)',
                      color: 'var(--color-text-primary)',
                      focusRingColor: 'var(--color-input-focus)'
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none"
              style={{
                backgroundColor: 'var(--color-button-primary)',
                color: 'var(--color-button-primary-text)',
                focusRingColor: 'var(--color-button-primary)'
              }}
            >
              {loading ? <LoadingSpinner size="small" text="" /> : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm select-none" style={{ color: 'var(--color-text-secondary)' }}>
              Didn't receive the code?{' '}
              <button
                type="button"
                className="font-medium hover:underline hover:shadow-none"
                style={{ color: 'var(--color-link)' }}
                onClick={() => {
                  resendOTPCode({email:email, fullName: fullName});
                  setOtp(['', '', '', '', '', ''])
                  
                }}
              >
                Resend code
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;