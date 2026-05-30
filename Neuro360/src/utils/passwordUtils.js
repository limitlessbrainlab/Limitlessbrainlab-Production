import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hashed password
 * Also handles legacy plain-text passwords for backward compatibility
 * @param {string} plainPassword - Plain text password to check
 * @param {string} storedPassword - Stored password (hashed or plain text)
 * @returns {Promise<boolean>} - true if match
 */
export const comparePassword = async (plainPassword, storedPassword) => {
  if (!plainPassword || !storedPassword) return false;

  // Check if stored password is a bcrypt hash (starts with $2a$ or $2b$)
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  // Legacy plain-text comparison (for passwords not yet migrated)
  return plainPassword === storedPassword;
};

/**
 * Check if a password is already hashed
 * @param {string} password
 * @returns {boolean}
 */
export const isHashed = (password) => {
  if (!password) return false;
  return password.startsWith('$2a$') || password.startsWith('$2b$');
};
