/**
 * Global App Providers wrapper
 * Combines ThemeProvider, AuthProvider, MultiAccountProvider
 */
import React from "react";
import { ThemeProvider } from "@contexts/ThemeContext";
import { AuthProvider } from "@contexts/AuthContext";
import { MultiAccountProvider } from "@contexts/MultiAccountContext";

export const AppProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MultiAccountProvider>{children}</MultiAccountProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppProviders;
