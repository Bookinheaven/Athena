import Note from "../models/notesModel.js";

class NoteService {
  async createNote(userId, data) {
    const { user, _id, ...safeData } = data;
    return Note.create({
      ...safeData,
      user: userId,
    });
  }

  async getNotes(userId) {
    return Note.find({ user: userId }).sort({ updatedAt: -1 });
  }

  async updateNote(userId, noteId, data) {
    const { user, _id, ...updateData } = data;
    return Note.findOneAndUpdate(
      { _id: noteId, user: userId },
      { $set: updateData },
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