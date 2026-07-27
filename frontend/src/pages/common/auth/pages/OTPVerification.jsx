import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';

const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP, resendOTPCode } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const firstInputRef = useRef(null);

  const email = location.state?.email;
  const fullName = location.state?.fullName;

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }
    firstInputRef.current?.focus();

    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleChange = (element, index) => {
    const value = element.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

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
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.some(isNaN)) return;

    const newOtp = [...otp];
    pastedData.forEach((value, index) => {
      if (index < 6) newOtp[index] = value;
    });
    setOtp(newOtp);

    const nextFocusIndex = Math.min(pastedData.length, 5);
    const inputs = e.target.parentElement.querySelectorAll('input');
    if (inputs[nextFocusIndex]) {
      inputs[nextFocusIndex].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP({ email, otp: otpString });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResendLoading(true);
    try {
      await resendOTPCode({ email, fullName });
      setTimer(60);
      setCanResend(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <div className="mb-8 select-none">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          Verify email address
        </h2>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Enter the 6-digit verification code sent to{' '}
          <span className="font-medium text-neutral-900 dark:text-neutral-200">{email}</span>
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-lg p-3.5 mb-6 flex items-start gap-3 border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
        >
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-medium leading-relaxed">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-mono font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 select-none">
            Verification Code
          </label>
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otp.map((data, index) => (
              <input
                key={index}
                ref={index === 0 ? firstInputRef : null}
                type="text"
                maxLength={1}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-mono font-bold rounded-lg border transition-all focus:outline-none focus:ring-1 ${
                  error 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/10' 
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-200 focus:ring-neutral-900 dark:focus:ring-neutral-200 shadow-xs'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed select-none"
        >
          {loading ? (
            <LoadingSpinner size="small" text="" />
          ) : (
            <>
              <span>Verify & Continue</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800/80 text-center select-none">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Didn't receive code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || resendLoading}
            className="font-medium text-neutral-900 dark:text-white hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1 cursor-pointer"
          >
            {resendLoading ? (
              'Resending...'
            ) : canResend ? (
              'Resend now'
            ) : (
              `Resend in ${timer}s`
            )}
          </button>
        </p>
      </div>
    </motion.div>
  );
};

export default OTPVerification;