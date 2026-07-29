import Goal from "../models/goalModel.js"

class GoalService {
    async createGoal(userId, data) {
        const goal = await Goal.create({
            user: userId,
            ...data
        })
        return goal;
    }
    
    async getGoals(userId) {
        return await Goal.find({ user: userId }).sort({ createdAt: -1})
    }

    async getGoalById(userId, goalId) {
        return Goal.findOne({ user: userId, _id: goalId })
    }

    async updateGoal(userId, goalId, data) {
        return Goal.findOneAndUpdate(
            { _id: goalId, user: userId},
            data,
            { new: true }
        );
    }

    async deleteGoal(userId, goalId) {
        await Goal.updateMany({ goal: goalId }, { goal: null })
        return Goal.findOneAndDelete({ _id: goalId, user: userId })
    }

    async recalculateProgress(goalId){
        const Task = (await import("../models/taskModel.js")).default;
        const tasks = await Task.find({ goal: goalId });
        if (!tasks.length) {
            await Goal.findByIdAndUpdate(goalId, { progress: 0 });
            return;
        }

        const completed = tasks.filter((task) => task.status === "completed").length;

        const progress = Math.round((completed / tasks.length) * 100);

        await Goal.findByIdAndUpdate(goalId, { progress });
    }
}

export default new GoalService();