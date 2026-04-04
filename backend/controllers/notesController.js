import NoteService from "../services/notesService.js";

class NoteController {
  async createNote(req, res) {
    try {
      const note = await NoteService.createNote(req.user.id, req.body);

      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getNotes(req, res) {
    try {
      const notes = await NoteService.getNotes(req.user.id);

      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateNote(req, res) {
    try {
      const note = await NoteService.updateNote(
        req.user.id,
        req.params.id,
        req.body
      );

      res.json(note);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async deleteNote(req, res) {
    try {
      await NoteService.deleteNote(req.user.id, req.params.id);

      res.json({ message: "Note deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new NoteController();