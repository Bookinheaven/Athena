import { userRepository } from "../repositories/userRepository.js";
import { closePgPool } from "../db/index.js";

/**
 * Shared CLI utility function to promote or demote a user's role.
 *
 * @param {"admin" | "user"} targetRole
 * @param {string} commandName
 */
export async function setUserRole(targetRole, commandName) {
  const emailArg = process.argv[2];

  if (!emailArg || !emailArg.trim()) {
    console.error(`Usage: npm run ${commandName} -- <email>`);
    process.exit(1);
  }

  const cleanEmail = emailArg.trim();

  try {
    const existingUser = await userRepository.findByEmail(cleanEmail);

    if (!existingUser) {
      console.error(`No user found with email: ${cleanEmail}`);
      process.exitCode = 1;
      return;
    }

    const updatedUser = await userRepository.update(existingUser.id, {
      accountType: targetRole,
    });

    if (!updatedUser) {
      console.error(`Failed to update account type for: ${cleanEmail}`);
      process.exitCode = 1;
      return;
    }

    if (targetRole === "admin") {
      console.log("Admin access granted.\n");
    } else {
      console.log("Admin access removed.\n");
    }

    console.log(`Email: ${updatedUser.email}`);
    console.log(`ID:    ${updatedUser.id}`);
    console.log(`Type:  ${updatedUser.type}`);
  } catch (error) {
    console.error(`Failed to execute ${commandName}:`, error.message);
    process.exitCode = 1;
  } finally {
    await closePgPool();
  }
}
