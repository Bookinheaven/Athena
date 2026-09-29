import User from "../models/userModel.js";

class UserService {
    allowedSettings = ["session", "theme"];

    allowedSessionKeys = [
        "breakDuration",
        "autoStartBreaks",
        "breaksNumber",
        "isSoundEnabled",
        "skipBreaks",
        "confirmReset",
        "soundOnTransition"
    ];

    defaultSettings = {
        theme: "dark",
        session: {
            breakDuration: 300,
            autoStartBreaks: true,
            breaksNumber: 4,
            isSoundEnabled: false,
            skipBreaks: true,
            confirmReset: true,
            soundOnTransition: false,
        },
    };

    validateType(type) {
        if (!this.allowedSettings.includes(type)) {
            throw new Error("Invalid settings type");
        }
    }

    /**
     * Get safe user profile
     * @param {string} userId
     * @returns {Object} safe user profile
     */
    async getProfile(userId) {
        const user = await User.findById(userId).select("-password -emailVerificationOTP -passwordResetOTP");
        if (!user) {
            throw new Error("User not found");
        }
        return {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            type: user.type,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            settings: {
                theme: user.settings?.theme || this.defaultSettings.theme,
                session: {
                    ...this.defaultSettings.session,
                    ...(user.settings?.session?.toObject ? user.settings.session.toObject() : user.settings?.session || {})
                }
            }
        };
    }

    /**
     * Update user profile with strict mass-assignment protection
     * @param {string} userId
     * @param {Object} data
     * @returns {Object} safe updated user profile
     */
    async updateProfile(userId, data) {
        if (!data || typeof data !== "object") {
            throw new Error("Invalid profile update data");
        }

        const ALLOWED_FIELDS = ["fullName"];
        const keys = Object.keys(data);
        if (keys.length === 0) {
            throw new Error("No fields provided for update");
        }

        for (const key of keys) {
            if (!ALLOWED_FIELDS.includes(key)) {
                throw new Error(`Field '${key}' cannot be updated via profile`);
            }
        }

        const update = {};
        if (data.fullName !== undefined) {
            const trimmed = String(data.fullName).trim();
            if (trimmed.length < 2 || trimmed.length > 50) {
                throw new Error("Full name must be between 2 and 50 characters");
            }
            update.fullName = trimmed;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: update },
            { new: true, runValidators: true }
        ).select("-password -emailVerificationOTP -passwordResetOTP");

        if (!user) {
            throw new Error("User not found");
        }

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            type: user.type,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            settings: {
                theme: user.settings?.theme || this.defaultSettings.theme,
                session: {
                    ...this.defaultSettings.session,
                    ...(user.settings?.session?.toObject ? user.settings.session.toObject() : user.settings?.session || {})
                }
            }
        };
    }

    /**
     * Get all user settings or specific type
     * @param {string} userId
     * @param {string} type [ session / theme ]
     * @returns {Object} user settings
     */
    async getSettings(userId, type) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        const userSettings = user.settings || {};
        const fullSettings = {
            theme: userSettings.theme || this.defaultSettings.theme,
            session: {
                ...this.defaultSettings.session,
                ...(userSettings.session?.toObject ? userSettings.session.toObject() : userSettings.session || {})
            }
        };
        if (!type) {
            return fullSettings;
        }
        this.validateType(type);
        return fullSettings[type];
    }

    /**
     * Update settings (supports partial updates and type routing)
     * @param {string} userId
     * @param {string|null} type
     * @param {Object} settings
     * @returns {Object} updated settings
     */
    async updateSettings(userId, type, settings) {
        if (!settings || typeof settings !== "object") {
            throw new Error("Invalid settings payload");
        }

        const updateFields = {};

        if (type === "session") {
            for (const key of Object.keys(settings)) {
                if (!this.allowedSessionKeys.includes(key)) {
                    throw new Error(`Invalid session setting key: ${key}`);
                }
                const val = settings[key];
                if (key === "breakDuration" || key === "breaksNumber") {
                    const num = Number(val);
                    if (isNaN(num) || num < 0) {
                        throw new Error(`${key} must be a non-negative number`);
                    }
                    updateFields[`settings.session.${key}`] = num;
                } else {
                    updateFields[`settings.session.${key}`] = Boolean(val);
                }
            }
        } else if (type === "theme") {
            const themeVal = typeof settings === "string" 
                ? settings 
                : (settings.theme || settings.id || settings.current);
            if (!themeVal || typeof themeVal !== "string") {
                throw new Error("Invalid theme value");
            }
            const cleanTheme = themeVal.trim();
            if (cleanTheme.length > 50) {
                throw new Error("Theme identifier too long");
            }
            updateFields["settings.theme"] = cleanTheme;
        } else if (!type) {
            if (settings.theme !== undefined) {
                const themeVal = typeof settings.theme === "string" 
                    ? settings.theme 
                    : (settings.theme?.id || settings.theme?.theme);
                if (typeof themeVal === "string" && themeVal.trim().length <= 50) {
                    updateFields["settings.theme"] = themeVal.trim();
                }
            }
            if (settings.session && typeof settings.session === "object") {
                for (const key of Object.keys(settings.session)) {
                    if (this.allowedSessionKeys.includes(key)) {
                        const val = settings.session[key];
                        if (key === "breakDuration" || key === "breaksNumber") {
                            const num = Number(val);
                            if (!isNaN(num) && num >= 0) {
                                updateFields[`settings.session.${key}`] = num;
                            }
                        } else {
                            updateFields[`settings.session.${key}`] = Boolean(val);
                        }
                    }
                }
            }
        } else {
            this.validateType(type);
        }

        if (Object.keys(updateFields).length === 0) {
            throw new Error("No valid settings fields provided for update");
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true }
        );
        if (!user) {
            throw new Error("User not found");
        }

        const updatedSettings = {
            theme: user.settings?.theme || this.defaultSettings.theme,
            session: {
                ...this.defaultSettings.session,
                ...(user.settings?.session?.toObject ? user.settings.session.toObject() : user.settings?.session || {})
            }
        };

        return type ? updatedSettings[type] : updatedSettings;
    }

    /**
     * Resets session/theme settings
     * @param {string} userId
     * @param {string|null} type
     * @returns {Object} default session/theme settings
     */
    async resetSettings(userId, type) {
        const defaults = this.defaultSettings;
        let update;
        if (!type) {
            update = { 
                $set: { 
                    "settings.session": defaults.session,
                    "settings.theme": defaults.theme
                } 
            };
        } else {
            this.validateType(type);
            if (defaults[type] === undefined) {
                throw new Error("Settings type has no defaults set");
            }
            update = {
                $set: { [`settings.${type}`]: defaults[type] }
            };
        }
        const user = await User.findByIdAndUpdate(
            userId,
            update,
            { new: true }
        );
        if (!user) {
            throw new Error("User not found");
        }
        const currentSettings = {
            theme: user.settings?.theme || this.defaultSettings.theme,
            session: {
                ...this.defaultSettings.session,
                ...(user.settings?.session?.toObject ? user.settings.session.toObject() : user.settings?.session || {})
            }
        };
        return type ? currentSettings[type] : currentSettings;
    }
}

export default new UserService();