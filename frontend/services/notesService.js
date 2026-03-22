import RequestService from "./requestService";

class NotesService extends RequestService {
  createNotes(payload) {
    return this.request("/notes", { method: "POST", body: payload });
  }

  getNotes() {
    return this.request("/notes", { method: "GET" });
  }

  updateNote(notesId, payload) {
    return this.request(`/notes/${notesId}`, { method: "PATCH", body: payload });
  }

  deleteNote(notesId) {
    return this.request(`/notes/${notesId}`, { method: "DELETE" })
  }
}

export default new NotesService();