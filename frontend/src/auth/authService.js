import config from "../config";

class AuthService {
  async login(username, password) {
    const response = await fetch(`${config.apiUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      let message = "Login failed";
      try {
        const data = await response.json();
        message = data.message || message;
      } catch {}
      throw new Error(message);
    }

    const data = await response.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("roles", JSON.stringify(data.roles || []));
    localStorage.setItem("tokenExpiry", Date.now() + data.expiresIn * 1000);
    return data;
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("roles");
    localStorage.removeItem("tokenExpiry");
  }

  getToken() {
    const expiry = localStorage.getItem("tokenExpiry");
    if (expiry && parseInt(expiry, 10) < Date.now()) {
      this.logout();
      return null;
    }
    return localStorage.getItem("token");
  }

  isLoggedIn() {
    return !!this.getToken();
  }

  getUsername() {
    return localStorage.getItem("username");
  }

  getRoles() {
    const roles = localStorage.getItem("roles");
    return roles ? JSON.parse(roles) : [];
  }

  getTokenExpiry() {
    const expiry = localStorage.getItem("tokenExpiry");
    return expiry ? parseInt(expiry, 10) : null;
  }

  hasRole(role) {
    return this.getRoles().includes(role);
  }
}

export default new AuthService();
