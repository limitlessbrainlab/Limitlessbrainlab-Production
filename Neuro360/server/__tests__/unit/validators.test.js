/**
 * Unit Tests for Input Validators
 * Point 11: Unit Testing
 */

const { describe, it, expect } = require('@jest/globals');
const {
  emailSchema,
  passwordSchema,
  loginSchema,
  clinicSignupSchema,
  qeegUploadSchema
} = require('../../validators/schemas');

describe('Input Validators', () => {
  describe('Email Validation', () => {
    it('should accept valid email', async () => {
      const result = await emailSchema.parseAsync('test@example.com');
      expect(result).toBe('test@example.com');
    });

    it('should reject invalid email', async () => {
      await expect(emailSchema.parseAsync('invalid-email')).rejects.toThrow();
    });

    it('should convert to lowercase', async () => {
      const result = await emailSchema.parseAsync('TEST@EXAMPLE.COM');
      expect(result).toBe('test@example.com');
    });
  });

  describe('Password Validation', () => {
    it('should accept strong password', async () => {
      const result = await passwordSchema.parseAsync('SecurePass123!');
      expect(result).toBe('SecurePass123!');
    });

    it('should reject short password', async () => {
      await expect(passwordSchema.parseAsync('short')).rejects.toThrow();
    });

    it('should require minimum 8 characters', async () => {
      await expect(passwordSchema.parseAsync('Pass123')).rejects.toThrow();
    });
  });

  describe('Login Schema', () => {
    it('should validate complete login', async () => {
      const data = {
        email: 'user@example.com',
        password: 'SecurePassword123'
      };
      const result = await loginSchema.parseAsync(data);
      expect(result.email).toBe('user@example.com');
      expect(result.password).toBe('SecurePassword123');
    });

    it('should reject missing email', async () => {
      await expect(loginSchema.parseAsync({ password: 'SecurePassword123' })).rejects.toThrow();
    });

    it('should reject missing password', async () => {
      await expect(loginSchema.parseAsync({ email: 'user@example.com' })).rejects.toThrow();
    });
  });

  describe('Clinic Signup Schema', () => {
    it('should validate complete clinic signup', async () => {
      const data = {
        clinicName: 'Test Clinic',
        email: 'clinic@example.com',
        password: 'SecurePassword123',
        contactPerson: 'Dr. Smith'
      };
      const result = await clinicSignupSchema.parseAsync(data);
      expect(result.clinicName).toBe('Test Clinic');
    });

    it('should require clinic name', async () => {
      const data = {
        email: 'clinic@example.com',
        password: 'SecurePassword123',
        contactPerson: 'Dr. Smith'
      };
      await expect(clinicSignupSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject short clinic name', async () => {
      const data = {
        clinicName: 'C',
        email: 'clinic@example.com',
        password: 'SecurePassword123',
        contactPerson: 'Dr. Smith'
      };
      await expect(clinicSignupSchema.parseAsync(data)).rejects.toThrow();
    });
  });

  describe('QEEG Upload Schema', () => {
    it('should validate complete upload', async () => {
      const data = {
        patientId: '550e8400-e29b-41d4-a716-446655440000',
        notes: 'Initial assessment'
      };
      const result = await qeegUploadSchema.parseAsync(data);
      expect(result.patientId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should reject invalid UUID', async () => {
      const data = {
        patientId: 'invalid-uuid'
      };
      await expect(qeegUploadSchema.parseAsync(data)).rejects.toThrow();
    });

    it('should reject missing patientId', async () => {
      const data = {
        notes: 'Initial assessment'
      };
      await expect(qeegUploadSchema.parseAsync(data)).rejects.toThrow();
    });
  });
});
