import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@contexts/AuthContext';
import { useMultiAccount } from '@contexts/MultiAccountContext';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import AccountSwitcherModal from '@/components/AccountSwitcherModal';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resendOTPCode } = useAuth();
  const { saveAccountToken, savedAccounts } = useMultiAccount();
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    const prefilled = location.state?.prefillEmail || location.state?.email;
    const savedEmail = localStorage.getItem('athena_remembered_email');
    if (prefilled) {
      setFormData((prev) => ({
        ...prev,
        usernameOrEmail: prefilled,
      }));
      passwordRef.current?.focus();
    } else if (savedEmail) {
      setFormData((prev) => ({
        ...prev,
        usernameOrEmail: savedEmail,
        rememberMe: true
      }));
      passwordRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
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
      if (res?.token && res?.user?.id) {
        saveAccountToken(res.user.id, res.token);
      }
      if (formData.rememberMe) {
        localStorage.setItem('athena_remembered_email', formData.usernameOrEmail);
      } else {
        localStorage.removeItem('athena_remembered_email');
      }
      if (res?.message === "Please verify your email before logging in") {
        resendOTPCode({ email: res.userData.email, fullName: res.userData.fullName });
        navigate('/verify-email', { state: { email: res.userData.email, fullName: res.userData.fullName } });
        return;
      }
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: error.message || "Failed to sign in. Please check your credentials." });
    } finally {
      setLoading(false);
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
          Sign in to your workspace
        </h2>
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          Enter your credentials to access your focus sessions and analytics.
        </p>
      </div>

      {errors.submit && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-lg p-3.5 mb-6 flex items-start gap-3 border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
        >
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-medium leading-relaxed">{errors.submit}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="usernameOrEmail" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 select-none">
            Username or Email
          </label>
          <input
            ref={inputRef}
            id="usernameOrEmail"
            name="usernameOrEmail"
            type="text"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            autoComplete="username"
            className={`w-full px-3.5 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
              errors.usernameOrEmail 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/10' 
                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-neutral-900 dark:focus:border-neutral-200 focus:ring-neutral-900 dark:focus:ring-neutral-200'
            }`}
            placeholder="name@example.com"
          />
          {errors.usernameOrEmail && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
              <span>•</span> {errors.usernameOrEmail}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 select-none">
            <label htmlFor="password" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              ref={passwordRef}
              name="password"
              autoComplete="current-password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 pr-10 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
                errors.password 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/10' 
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-neutral-900 dark:focus:border-neutral-200 focus:ring-neutral-900 dark:focus:ring-neutral-200'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors focus:outline-none cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
              <span>•</span> {errors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 select-none">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-3.5 h-3.5 rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white bg-white dark:bg-neutral-800 cursor-pointer"
            />
            <span>Remember my workspace account</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-2.5 px-4 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed select-none"
        >
          {loading ? (
            <LoadingSpinner size="small" text="" />
          ) : (
            <>
              <span>Continue with Email</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800/80 text-center select-none space-y-2">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Don't have a workspace?{' '}
          <Link
            to="/register"
            className="font-medium text-neutral-900 dark:text-white hover:underline transition-all"
          >
            Create account
          </Link>
        </p>

        {savedAccounts && savedAccounts.length > 0 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Or{' '}
            <button
              type="button"
              onClick={() => setShowSwitcherModal(true)}
              className="font-medium text-neutral-900 dark:text-white hover:underline transition-all cursor-pointer"
            >
              switch to an existing account ({savedAccounts.length})
            </button>
          </p>
        )}
      </div>

      <AccountSwitcherModal
        isOpen={showSwitcherModal}
        onClose={() => setShowSwitcherModal(false)}
      />
    </motion.div>
  );
};

export default Login;