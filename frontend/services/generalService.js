import RequestService from "./requestService";

class GeneralService extends RequestService {
  async getQuote() {
    return this.request("/general/motivational", {
        method: "GET"
    })
  }
}

export default new GeneralService();