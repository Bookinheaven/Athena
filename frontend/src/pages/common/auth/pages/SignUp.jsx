import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@contexts/AuthContext";
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateFullName,
} from "@/utils/validation";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import { APP_CONFIG } from "@/config/branding";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "bg-neutral-200 dark:bg-neutral-800" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 4) return { score, label: "Medium", color: "bg-amber-500" };
    return { score, label: "Strong", color: "bg-emerald-500 dark:bg-emerald-400" };
  };

  const pwdStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    let newValue = value;
    if (name === "fullName") {
      newValue = newValue.replace(/\s+/g, " ").trimStart();
    } else if (name === "email") {
      newValue = newValue.toLowerCase();
    } else {
      if (/\s/.test(newValue)) return;
    }
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
    const usernameError = validateUsername(formData.username);
    if (usernameError) newErrors.username = usernameError;
    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    const fullNameError = validateFullName(formData.fullName);
    if (fullNameError) newErrors.fullName = fullNameError;
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(formData);
      navigate("/verify-email", {
        state: { email: formData.email, fullName: formData.fullName },
      });
    } catch (error) {
      setErrors({ submit: error.message || "Failed to register account." });
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
      <div className="mb-6 select-none">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          Create workspace account
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Join {APP_CONFIG.shortName} and start building structured focus habits.
        </p>
      </div>

      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-lg p-3.5 mb-5 flex items-start gap-3 border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
        >
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-medium leading-relaxed">{errors.submit}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="fullName" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 select-none">
            Full Name
          </label>
          <input
            ref={inputRef}
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full px-3.5 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
              errors.fullName
                ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/10"
                : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-neutral-900 dark:focus:border-neutral-200 focus:ring-neutral-900 dark:focus:ring-neutral-200"
            }`}
            placeholder="Ada Lovelace"
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
              • {errors.fullName}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 select-none">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
                errors.username
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/10"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-neutral-900 dark:focus:border-neutral-200 focus:ring-neutral-900 dark:focus:ring-neutral-200"
              }`}
              placeholder="adalovelace"
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                • {errors.username}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 select-none">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className={`w-full px-3.5 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
                errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/10"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-neutral-900 dark:focus:border-neutral-200 focus:ring-neutral-900 dark:focus:ring-neutral-200"
              }`}
              placeholder="ada@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                • {errors.email}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 select-none">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 pr-10 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
                errors.password
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/10"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-neutral-900 dark:focus:border-neutral-200 focus:ring-neutral-900 dark:focus:ring-neutral-200"
              }`}
              placeholder="Min. 8 chars, number & symbol"
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
          {formData.password && (
            <div className="mt-1.5 flex items-center gap-2 select-none">
              <div className="flex-1 h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex gap-1">
                <div className={`h-full flex-1 transition-colors duration-300 ${pwdStrength.score >= 1 ? pwdStrength.color : "bg-transparent"}`} />
                <div className={`h-full flex-1 transition-colors duration-300 ${pwdStrength.score >= 3 ? pwdStrength.color : "bg-transparent"}`} />
                <div className={`h-full flex-1 transition-colors duration-300 ${pwdStrength.score >= 5 ? pwdStrength.color : "bg-transparent"}`} />
              </div>
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-neutral-500">
                {pwdStrength.label}
              </span>
            </div>
          )}
          {errors.password && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
              • {errors.password}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 select-none">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 pr-10 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
                errors.confirmPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/20 dark:bg-red-950/10"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-neutral-900 dark:focus:border-neutral-200 focus:ring-neutral-900 dark:focus:ring-neutral-200"
              }`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors focus:outline-none cursor-pointer"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
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
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
              • {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="pt-1">
          <div className="flex items-start">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="h-4 w-4 mt-0.5 rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-neutral-900 dark:focus:ring-white cursor-pointer bg-transparent"
            />
            <label
              htmlFor="agreeToTerms"
              className="ml-2 block text-xs select-none leading-relaxed text-neutral-500 dark:text-neutral-400"
            >
              I agree to the{" "}
              <a href="#" className="font-medium text-neutral-900 dark:text-white hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="font-medium text-neutral-900 dark:text-white hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
              • {errors.agreeToTerms}
            </p>
          )}
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
              <span>Create Workspace</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800/80 text-center select-none">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-neutral-900 dark:text-white hover:underline transition-all"
          >
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default Register;
