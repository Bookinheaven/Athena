const API_BASE_URL = import.meta.env.VITE_API_URL;

class AuthService {

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      ...options,
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }
    return data;
  }

  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: userData,
    });
  }

  async resendCode(userData) {
    return this.request("/auth/resend-code", {
      method: "POST",
      body: userData,
    });
  }

  async verifyEmail(email, otp) {
    return this.request("/auth/verify-email", {
      method: "POST",
      body: { email, otp },
    });
  }

  async login(credentials) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: credentials,
    });
    return response;
  }

  async requestPasswordReset(email) {
    return this.request("/auth/request-password-reset", {
      method: "POST",
      body: { email },
    });
  }

  async resetPassword(email, otp, newPassword) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: { email, otp, newPassword },
    });
  }

  async getCurrentUser() {
    const response = await this.request("/auth/me");
    return response.user;
  }

  async logout() {
    await this.request("/auth/logout", { method: "POST" });
  }
}

export default new AuthService();
