import notesRepository from "../repositories/notesRepository.js";

class NoteService {
  async createNote(userId, data) {
    const { user, _id, ...safeData } = data;
    return notesRepository.create(userId, safeData);
  }

  async getNotes(userId) {
    return notesRepository.findByUserId(userId);
  }

  async updateNote(userId, noteId, data) {
    const { user, _id, ...updateData } = data;
    return notesRepository.update(userId, noteId, updateData);
  }

  async deleteNote(userId, noteId) {
    return notesRepository.delete(userId, noteId);
  }

  async getNotesByTask(userId, taskId) {
    return notesRepository.findByTaskId(userId, taskId);
  }

  async getNotesByGoal(userId, goalId) {
    return notesRepository.findByGoalId(userId, goalId);
  }
}

export default new NoteService();