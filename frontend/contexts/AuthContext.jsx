import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

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
        setUser(userData);
      } catch (error) {
        // console.error("Auto login failed:", error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);
  

  const login = async (credentials) => {
    const userData = await authService.login(credentials);
    setUser(userData.user);
    return userData;
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

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    resendOTPCode,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
