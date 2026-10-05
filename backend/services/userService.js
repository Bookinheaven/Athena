import userRepository from "../repositories/userRepository.js";
import { isValidTimezone } from "../utils/dateUtils.js";

class UserService {
  allowedSettings = ["session", "theme", "timezone"];

  allowedSessionKeys = [
    "breakDuration",
    "autoStartBreaks",
    "breaksNumber",
    "isSoundEnabled",
    "skipBreaks",
    "confirmReset",
    "soundOnTransition",
  ];

  defaultSettings = {
    theme: "dark",
    timezone: "UTC",
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

  async _findUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  /**
   * Get safe user profile
   * @param {string} userId
   * @returns {Object} safe user profile
   */
  async getProfile(userId) {
    const user = await this._findUser(userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      type: user.type,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      settings: {
        theme: user.settings?.theme || this.defaultSettings.theme,
        timezone: user.settings?.timezone || this.defaultSettings.timezone,
        session: {
          ...this.defaultSettings.session,
          ...(user.settings?.session || {}),
        },
      },
    };
  }

  /**
   * Update basic profile fields
   * @param {string} userId
   * @param {Object} data
   * @returns {Object} updated user profile
   */
  async updateProfile(userId, data) {
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

    const user = await userRepository.update(userId, update);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      type: user.type,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      settings: {
        theme: user.settings?.theme || this.defaultSettings.theme,
        timezone: user.settings?.timezone || this.defaultSettings.timezone,
        session: {
          ...this.defaultSettings.session,
          ...(user.settings?.session || {}),
        },
      },
    };
  }

  /**
   * Get all user settings or specific type
   * @param {string} userId
   * @param {string} type [ session / theme / timezone ]
   * @returns {Object} user settings
   */
  async getSettings(userId, type) {
    const user = await this._findUser(userId);
    const userSettings = user.settings || {};
    const fullSettings = {
      theme: userSettings.theme || this.defaultSettings.theme,
      timezone: userSettings.timezone || this.defaultSettings.timezone,
      session: {
        ...this.defaultSettings.session,
        ...(userSettings.session || {}),
      },
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
        if (key === "breakDuration") {
          const num = Number(val);
          if (isNaN(num) || num < 0) {
            throw new Error(`${key} must be a non-negative number`);
          }
          updateFields.breakDurationSeconds = num;
        } else if (key === "breaksNumber") {
          const num = Number(val);
          if (isNaN(num) || num < 0) {
            throw new Error(`${key} must be a non-negative number`);
          }
          updateFields.breaksNumber = num;
        } else if (key === "isSoundEnabled") {
          updateFields.soundEnabled = Boolean(val);
        } else {
          updateFields[key] = Boolean(val);
        }
      }
    } else if (type === "theme") {
      const themeVal =
        typeof settings === "string"
          ? settings
          : settings.theme || settings.id || settings.current;
      if (!themeVal || typeof themeVal !== "string") {
        throw new Error("Invalid theme value");
      }
      const cleanTheme = themeVal.trim();
      if (cleanTheme.length > 50) {
        throw new Error("Theme identifier too long");
      }
      updateFields.theme = cleanTheme;
    } else if (type === "timezone") {
      const tzVal =
        typeof settings === "string"
          ? settings
          : settings.timezone || settings.name;
      if (!tzVal || !isValidTimezone(tzVal)) {
        throw new Error("Invalid IANA timezone");
      }
      updateFields.timezone = tzVal.trim();
    } else if (!type) {
      if (settings.theme !== undefined) {
        const themeVal =
          typeof settings.theme === "string"
            ? settings.theme
            : settings.theme?.id || settings.theme?.theme;
        if (typeof themeVal === "string" && themeVal.trim().length <= 50) {
          updateFields.theme = themeVal.trim();
        }
      }
      if (settings.timezone !== undefined) {
        const tzVal =
          typeof settings.timezone === "string"
            ? settings.timezone
            : settings.timezone?.timezone || settings.timezone?.name;
        if (typeof tzVal !== "string" || !isValidTimezone(tzVal)) {
          throw new Error("Invalid IANA timezone preference");
        }
        updateFields.timezone = tzVal.trim();
      }
      if (settings.session && typeof settings.session === "object") {
        for (const key of Object.keys(settings.session)) {
          if (this.allowedSessionKeys.includes(key)) {
            const val = settings.session[key];
            if (key === "breakDuration") {
              const num = Number(val);
              if (!isNaN(num) && num >= 0) {
                updateFields.breakDurationSeconds = num;
              }
            } else if (key === "breaksNumber") {
              const num = Number(val);
              if (!isNaN(num) && num >= 0) {
                updateFields.breaksNumber = num;
              }
            } else if (key === "isSoundEnabled") {
              updateFields.soundEnabled = Boolean(val);
            } else {
              updateFields[key] = Boolean(val);
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

    const user = await userRepository.update(userId, updateFields);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedSettings = {
      theme: user.settings?.theme || this.defaultSettings.theme,
      timezone: user.settings?.timezone || this.defaultSettings.timezone,
      session: {
        ...this.defaultSettings.session,
        ...(user.settings?.session || {}),
      },
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
    const update = {};

    if (!type) {
      update.breakDurationSeconds = defaults.session.breakDuration;
      update.autoStartBreaks = defaults.session.autoStartBreaks;
      update.breaksNumber = defaults.session.breaksNumber;
      update.soundEnabled = defaults.session.isSoundEnabled;
      update.skipBreaks = defaults.session.skipBreaks;
      update.confirmReset = defaults.session.confirmReset;
      update.soundOnTransition = defaults.session.soundOnTransition;
      update.theme = defaults.theme;
      update.timezone = defaults.timezone;
    } else {
      this.validateType(type);
      if (type === "session") {
        update.breakDurationSeconds = defaults.session.breakDuration;
        update.autoStartBreaks = defaults.session.autoStartBreaks;
        update.breaksNumber = defaults.session.breaksNumber;
        update.soundEnabled = defaults.session.isSoundEnabled;
        update.skipBreaks = defaults.session.skipBreaks;
        update.confirmReset = defaults.session.confirmReset;
        update.soundOnTransition = defaults.session.soundOnTransition;
      } else if (type === "theme") {
        update.theme = defaults.theme;
      } else if (type === "timezone") {
        update.timezone = defaults.timezone;
      }
    }

    const user = await userRepository.update(userId, update);
    if (!user) {
      throw new Error("User not found");
    }

    const currentSettings = {
      theme: user.settings?.theme || this.defaultSettings.theme,
      timezone: user.settings?.timezone || this.defaultSettings.timezone,
      session: {
        ...this.defaultSettings.session,
        ...(user.settings?.session || {}),
      },
    };

    return type ? currentSettings[type] : currentSettings;
  }
}

export default new UserService();