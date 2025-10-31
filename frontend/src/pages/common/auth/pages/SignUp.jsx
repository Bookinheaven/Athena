import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../contexts/AuthContext";
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateFullName,
} from "../../../../utils/validation";
import LoadingSpinner from "../../../../components/LoadingSpinner/LoadingSpinner";

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }
    let newValue = value;
    if (name === "fullName") {
      newValue = newValue.replace(/\s+/g, " ").trimStart();
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
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div
          className="rounded-lg p-8 shadow-lg"
          style={{
            backgroundColor: "var(--color-card-background)",
            border: "1px solid var(--color-card-border)",
          }}
        >
          <div className="text-center mb-7">
            <h2
              className="text-3xl font-bold select-none"
              style={{ color: "var(--color-text-primary)" }}
            >
              Create your account
            </h2>
            <p
              className="mt-2 text-sm select-none"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Join Athena and start your intelligent study journey
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div
                className="rounded-md p-4"
                style={{
                  backgroundColor: "var(--color-error-bg)",
                  color: "var(--color-error-text)",
                }}
              >
                <p className="text-sm">{errors.submit}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium mb-2 select-none"
                style={{ color: "var(--color-text-primary)" }}
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: "var(--color-input-background)",
                  borderColor: errors.fullName
                    ? "var(--color-button-danger)"
                    : "var(--color-input-border)",
                  color: "var(--color-text-primary)",
                  focusRingColor: "var(--color-input-focus)",
                }}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--color-error-text)" }}
                >
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-2 select-none"
                style={{ color: "var(--color-text-primary)" }}
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: "var(--color-input-background)",
                  borderColor: errors.username
                    ? "var(--color-button-danger)"
                    : "var(--color-input-border)",
                  color: "var(--color-text-primary)",
                  focusRingColor: "var(--color-input-focus)",
                }}
                placeholder="Choose a username"
              />
              {errors.username && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--color-error-text)" }}
                >
                  {errors.username}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 select-none"
                style={{ color: "var(--color-text-primary)" }}
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: "var(--color-input-background)",
                  borderColor: errors.email
                    ? "var(--color-button-danger)"
                    : "var(--color-input-border)",
                  color: "var(--color-text-primary)",
                  focusRingColor: "var(--color-input-focus)",
                }}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--color-error-text)" }}
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 select-none"
                style={{ color: "var(--color-text-primary)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: "var(--color-input-background)",
                    borderColor: errors.password
                      ? "var(--color-button-danger)"
                      : "var(--color-input-border)",
                    color: "var(--color-text-primary)",
                    focusRingColor: "var(--color-input-focus)",
                  }}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 pl-3 flex items-center"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--color-error-text)" }}
                >
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2 select-none"
                style={{ color: "var(--color-text-primary)" }}
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: "var(--color-input-background)",
                    borderColor: errors.confirmPassword
                      ? "var(--color-button-danger)"
                      : "var(--color-input-border)",
                    color: "var(--color-text-primary)",
                    focusRingColor: "var(--color-input-focus)",
                  }}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 pl-3  flex items-center"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {showConfirmPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--color-error-text)" }}
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="agreeToTerms"
                className="ml-2 block text-sm select-none"
                style={{ color: "var(--color-text-primary)" }}
              >
                I agree to the{" "}
                <a
                  href="#"
                  className="hover:underline"
                  style={{ color: "var(--color-link)" }}
                >
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="hover:underline"
                  style={{ color: "var(--color-link)" }}
                >
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p
                className="text-sm"
                style={{ color: "var(--color-error-text)" }}
              >
                {errors.agreeToTerms}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none"
              style={{
                backgroundColor: "var(--color-button-primary)",
                color: "var(--color-button-primary-text)",
                focusRingColor: "var(--color-button-primary)",
              }}
            >
              {loading ? (
                <LoadingSpinner size="small" text="" />
              ) : (
                "Create Account"
              )}
            </button>

            <div className="text-center">
              <p
                className="text-sm select-none"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium hover:underline"
                  style={{ color: "var(--color-link)" }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
