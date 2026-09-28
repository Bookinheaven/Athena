import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";
import { normalizeUser, clearUserTransientState } from "../services/userStateService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(normalizeUser(userData));
      } catch (error) {
        setUser(null);
        clearUserTransientState();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    clearUserTransientState();
    const userData = await authService.login(credentials);
    const normalized = normalizeUser(userData.user);
    setUser(normalized);
    return {
      ...userData,
      user: normalized,
    };
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const verifyEmail = async (email, otp) => {
    return await authService.verifyEmail(email, otp);
  };

  const requestPasswordReset = async (email) => {
    return await authService.requestPasswordReset(email);
  };

  const resendOTPCode = async (userData) => {
    return await authService.resendCode(userData);
  };

  const resetPassword = async (email, otp, newPassword) => {
    return await authService.resetPassword(email, otp, newPassword);
  };

  const switchSession = async (token) => {
    clearUserTransientState();
    const res = await authService.switchAccount(token);
    if (res?.success && res.user) {
      const normalized = normalizeUser(res.user);
      setUser(normalized);
      return {
        ...res,
        user: normalized,
      };
    }
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearUserTransientState();
      setUser(null);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    switchSession,
    register,
    resendOTPCode,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
