import { eq, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDrizzleDb } from "../db/index.js";
import { users } from "../db/schema/users.js";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeUserId(id) {
  if (!id) return null;
  const str = typeof id === "string" ? id.trim() : id.toString().trim();
  if (UUID_REGEX.test(str)) return str;
  return null;
}

/**
 * Maps a raw PostgreSQL user row into the standard Athena domain user object.
 *
 * @param {object} row
 * @returns {object|null}
 */
export function toDomainUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    usernameLower: row.usernameLower,
    email: row.email,
    password: row.passwordHash,
    type: row.accountType || "user",
    fullName: row.fullName,
    isEmailVerified: Boolean(row.isEmailVerified),
    isActive: Boolean(row.isActive),
    lastLogin: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    settings: {
      theme: row.theme || "dark",
      timezone: row.timezone || "UTC",
      session: {
        breakDuration: row.breakDurationSeconds ?? 300,
        autoStartBreaks: row.autoStartBreaks ?? true,
        breaksNumber: row.breaksNumber ?? 4,
        isSoundEnabled: row.soundEnabled ?? false,
        skipBreaks: row.skipBreaks ?? true,
        confirmReset: row.confirmReset ?? true,
        soundOnTransition: row.soundOnTransition ?? false,
      },
    },
    async comparePassword(candidatePassword) {
      if (!this.password || !candidatePassword) return false;
      return bcrypt.compare(candidatePassword, this.password);
    },
  };
}

class UserRepository {
  async findById(id) {
    const cleanId = normalizeUserId(id);
    if (!cleanId) return null;
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, cleanId))
      .limit(1);
    return toDomainUser(rows[0]);
  }

  async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);
    return toDomainUser(rows[0]);
  }

  async findByUsernameLower(usernameLower) {
    if (!usernameLower) return null;
    const clean = usernameLower.trim().toLowerCase();
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.usernameLower, clean))
      .limit(1);
    return toDomainUser(rows[0]);
  }

  async findByUsername(username) {
    if (!username) return null;
    return this.findByUsernameLower(username.trim().toLowerCase());
  }

  async findByEmailOrUsername(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim();
    const cleanLower = clean.toLowerCase();
    const db = getDrizzleDb();
    const rows = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, cleanLower),
          eq(users.usernameLower, cleanLower),
          eq(users.username, clean)
        )
      )
      .limit(1);
    return toDomainUser(rows[0]);
  }

  async create(userData) {
    const db = getDrizzleDb();
    const cleanUsername = userData.username.trim();
    const usernameLower = cleanUsername.toLowerCase();
    const cleanEmail = userData.email.trim().toLowerCase();

    let passwordHash = userData.password;
    if (userData.password && !userData.password.startsWith("$2")) {
      passwordHash = await bcrypt.hash(userData.password, 12);
    }

    const sessionPrefs = userData.settings?.session || userData.focusPreferences || {};

    const values = {
      username: cleanUsername,
      usernameLower,
      email: cleanEmail,
      passwordHash,
      accountType: userData.type || userData.accountType || "user",
      fullName: userData.fullName.trim(),
      isEmailVerified: Boolean(userData.isEmailVerified),
      isActive: userData.isActive !== false,
      theme: (userData.settings?.theme || userData.theme || "dark").slice(0, 20),
      timezone: (userData.settings?.timezone || userData.timezone || "UTC").slice(0, 50),
      breakDurationSeconds: sessionPrefs.breakDuration ?? 300,
      autoStartBreaks: sessionPrefs.autoStartBreaks ?? true,
      breaksNumber: sessionPrefs.breaksNumber ?? 4,
      soundEnabled: sessionPrefs.isSoundEnabled ?? sessionPrefs.soundEnabled ?? false,
      skipBreaks: sessionPrefs.skipBreaks ?? true,
      confirmReset: sessionPrefs.confirmReset ?? true,
      soundOnTransition: sessionPrefs.soundOnTransition ?? false,
    };

    if (userData.id || userData._id) {
      values.id = normalizeUserId(userData.id || userData._id);
    }

    const rows = await db.insert(users).values(values).returning();
    return toDomainUser(rows[0]);
  }

  async update(id, updateData) {
    const cleanId = normalizeUserId(id);
    if (!cleanId || !updateData) return null;
    const db = getDrizzleDb();
    const fieldsToSet = {
      updatedAt: new Date(),
    };

    if (updateData.username !== undefined) {
      const cleanUsername = updateData.username.trim();
      fieldsToSet.username = cleanUsername;
      fieldsToSet.usernameLower = cleanUsername.toLowerCase();
    }
    if (updateData.fullName !== undefined) {
      fieldsToSet.fullName = updateData.fullName.trim();
    }
    if (updateData.accountType !== undefined || updateData.type !== undefined) {
      fieldsToSet.accountType = String(updateData.accountType || updateData.type).slice(0, 20);
    }
    if (updateData.isEmailVerified !== undefined) {
      fieldsToSet.isEmailVerified = Boolean(updateData.isEmailVerified);
    }
    if (updateData.isActive !== undefined) {
      fieldsToSet.isActive = Boolean(updateData.isActive);
    }
    if (updateData.lastLogin !== undefined || updateData.lastLoginAt !== undefined) {
      fieldsToSet.lastLoginAt = updateData.lastLogin || updateData.lastLoginAt;
    }
    if (updateData.password !== undefined) {
      let pwd = updateData.password;
      if (!pwd.startsWith("$2")) {
        pwd = await bcrypt.hash(pwd, 12);
      }
      fieldsToSet.passwordHash = pwd;
    }

    // Settings
    if (updateData.theme !== undefined) {
      fieldsToSet.theme = String(updateData.theme).slice(0, 20);
    }
    if (updateData.timezone !== undefined) {
      fieldsToSet.timezone = String(updateData.timezone).slice(0, 50);
    }
    if (updateData.breakDurationSeconds !== undefined) {
      fieldsToSet.breakDurationSeconds = Number(updateData.breakDurationSeconds);
    }
    if (updateData.autoStartBreaks !== undefined) {
      fieldsToSet.autoStartBreaks = Boolean(updateData.autoStartBreaks);
    }
    if (updateData.breaksNumber !== undefined) {
      fieldsToSet.breaksNumber = Number(updateData.breaksNumber);
    }
    if (updateData.soundEnabled !== undefined) {
      fieldsToSet.soundEnabled = Boolean(updateData.soundEnabled);
    }
    if (updateData.skipBreaks !== undefined) {
      fieldsToSet.skipBreaks = Boolean(updateData.skipBreaks);
    }
    if (updateData.confirmReset !== undefined) {
      fieldsToSet.confirmReset = Boolean(updateData.confirmReset);
    }
    if (updateData.soundOnTransition !== undefined) {
      fieldsToSet.soundOnTransition = Boolean(updateData.soundOnTransition);
    }

    const rows = await db
      .update(users)
      .set(fieldsToSet)
      .where(eq(users.id, cleanId))
      .returning();
    return toDomainUser(rows[0]);
  }

  async findAll() {
    const db = getDrizzleDb();
    const rows = await db.select().from(users).orderBy(users.createdAt);
    return rows.map(toDomainUser);
  }

  async delete(id) {
    const cleanId = normalizeUserId(id);
    if (!cleanId) return null;
    const db = getDrizzleDb();
    const rows = await db.delete(users).where(eq(users.id, cleanId)).returning();
    return toDomainUser(rows[0]);
  }

  async updateLastLogin(id) {
    return this.update(id, { lastLoginAt: new Date() });
  }

  async updateTimezone(id, timezone) {
    return this.update(id, { timezone });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
