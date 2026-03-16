import Note from "../models/notesModel.js";

class NoteService {
  async createNote(userId, data) {
    return Note.create({
      user: userId,
      ...data,
    });
  }

  async getNotes(userId) {
    return Note.find({ user: userId }).sort({ updatedAt: -1 });
  }

  async updateNote(userId, noteId, data) {
    return Note.findOneAndUpdate(
      { _id: noteId, user: userId },
      data,
      { new: true }
    );
  }

  async deleteNote(userId, noteId) {
    return Note.findOneAndDelete({
      _id: noteId,
      user: userId,
    });
  }

  async getNotesByTask(userId, taskId) {
    return Note.find({
      user: userId,
      task: taskId,
    });
  }

  async getNotesByGoal(userId, goalId) {
    return Note.find({
      user: userId,
      goal: goalId,
    });
  }
}

export default new NoteService();