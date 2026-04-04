import User from "../models/userModel.js";

/**
 * All the Services Like settings, .. can be performed.
 */
class UserService {
    allowedSettings = ["session"];

    defaultSettings = {
        session: {
            breakDuration: 300,
            autoStartBreaks: true,
            breaksNumber: 4
        },
    };

    validateType(type) {
        if (!this.allowedSettings.includes(type)) {
            throw new Error("Invalid settings type");
        }
    }

    /**
     * Get all user settings
     * @param {string} userId
     * @param {string} type [ session / all ]
     * @returns {Object} user settings
     */
    async getSettings(userId, type) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        const settings = user.settings || {};
        if (!type) {
            return settings;
        }
        this.validateType(type);
        return settings[type];
    }

    /**
     * Update session settings
     * Supports partial updates
     * @param {string} userId
     * @param {string} type
     * @param {Object} settings
     * @returns {Object} updated session settings
     */
    async updateSettings(userId, type, settings) {
        const updateFields = {};
        for (const key in settings) {
            updateFields[`settings.${type}.${key}`] = settings[key];
        }
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true }
        );
        if (!user) {
            throw new Error("User not found");
        }
        return user.settings[type];
    }

    /**
     * Resets session settings
     * @param {string} userId
     * @param {string} type
     * @returns {Object} default session settings
     */
    async resetSettings(userId, type) {
        let update;
        if (!type) {
            update = { settings: defaults };
        } else {
            this.validateType(type);
            if (!defaults[type]) {
                throw new Error("Settings type has no defaults set");
            }
            update = {
                $set: { [`settings.${type}`]: defaults[type] }
            }
        }
        const defaults = this.defaultSettings[type];
        const user = await User.findByIdAndUpdate(
            userId,
            update,
            { new: true }
        );
        if (!user) {
            throw new Error("User not found");
        }
        return user.settings[type];
    }
}

export default new UserService();