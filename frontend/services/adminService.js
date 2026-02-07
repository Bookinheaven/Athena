import RequestService from "./requestService";

class AdminService extends RequestService {
  async getUsers() {
    return this.request("/admin/users", {
      method: "GET"
    });
  }

  async addUsers(data) {
    let response = await this.request("/admin/add", {
      method: "POST",
      body: data
    });
    return response;
  }
  async deleteUsers(data) {
    let response = await this.request("/admin/delete", {
      method: "POST",
      body: { data }
    });
    return response;
  }
  async updateUser(id, user) {
    let response = await this.request("/admin/update", {
      method: "POST",
      body: {id, user}
    });
    return response;
  }

  async getSessions() {
    let response = await this.request("/admin/userSessions", {
      method: "GET"
    });
    return response;
  }
}

export default new AdminService();
