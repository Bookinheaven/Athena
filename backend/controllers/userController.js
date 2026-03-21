import UserService from "../services/userService.js";

class UserController {
    async getSettings(req, res) {
        try {
            const userId = req.user.id;
            const type = req.params.type;
            const settings = await UserService.getSettings(userId, type);
            res.status(200).json({
                success: true,
                settings: settings || {}
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
            
        }
    }
    
    async updateSettings(req, res) {
        try {
            const userId = req.user.id;
            const update = req.body;
            const type = req.params.type;
            const settings = await UserService.updateSettings(userId, type, update);
            res.status(200).json({
                success: true,
                settings: settings 
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
            
        }
    }
    
    async resetSettings(req, res) {
        try {
            const userId = req.user.id;
            const settings = await UserService.resetSettings(userId, type);
            const type = req.params.type;
            res.status(200).json({
                success: true,
                settings
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

}

export default new UserController();