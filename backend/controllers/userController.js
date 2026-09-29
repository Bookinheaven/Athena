import UserService from "../services/userService.js";
import { validationResult } from "express-validator";

class UserController {
    async getProfile(req, res) {
        try {
            const userId = req.user.id || req.user._id;
            const user = await UserService.getProfile(userId);
            res.status(200).json({
                success: true,
                user
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: errors.array()
                });
            }
            const userId = req.user.id || req.user._id;
            const updatedUser = await UserService.updateProfile(userId, req.body);
            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                user: updatedUser
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    async getSettings(req, res) {
        try {
            const userId = req.user.id || req.user._id;
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
            const userId = req.user.id || req.user._id;
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
            const userId = req.user.id || req.user._id;
            const type = req.params.type;
            const settings = await UserService.resetSettings(userId, type);
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