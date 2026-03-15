import RequestService from "./requestService";

class UserService extends RequestService {
  async getSettings(type = null) {
    return this.request(`/user/settings${type ? `/${type}` : ""}`, {
      method: "GET"
    });
  }

  async updateSettings(data, type = null) {
    return this.request(`/user/settings${type ? `/${type}` : ""}`, {
      method: "PATCH",
      body: data
    });
  }

  async resetSettings(type = null) {
    return this.request(`/user/settings${type ? `/${type}` : ""}/reset`, {
      method: "POST"
    });
  }
}

export default new UserService();
