const { z } = require('zod');

// Common schemas
const emailSchema = z.string().email('Invalid email format').toLowerCase();
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const phoneSchema = z.string().regex(/^[+\d\s\-()]+$/, 'Invalid phone number format').optional();
const uuidSchema = z.string().uuid('Invalid UUID format');

// File upload schemas
const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename required'),
  mimetype: z.enum(
    [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ],
    { message: 'Invalid file type' }
  ),
  size: z.number().max(100 * 1024 * 1024, 'File too large (max 100MB)')
});

// Authentication schemas
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required')
});

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name required').max(100),
  phone: phoneSchema
});

const clinicSignupSchema = z.object({
  clinicName: z.string().min(2, 'Clinic name required').max(200),
  email: emailSchema,
  password: passwordSchema,
  contactPerson: z.string().min(2, 'Contact person required').max(100),
  phone: phoneSchema,
  address: z.string().min(5, 'Address required').optional(),
  city: z.string().min(2, 'City required').optional(),
  state: z.string().min(2, 'State required').optional(),
  zipCode: z.string().optional()
});

// QEEG upload schema
const qeegUploadSchema = z.object({
  patientId: uuidSchema,
  clinicId: z.string().optional(),
  testDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional()
});

// Report generation schema
const reportGenerationSchema = z.object({
  patientId: uuidSchema,
  fileIds: z.array(uuidSchema).min(1, 'At least one file required'),
  reportType: z.enum(['summary', 'detailed', 'pdf']).default('summary'),
  includeRecommendations: z.boolean().default(true)
});

// Email validation
const emailSendSchema = z.object({
  to: z.string().email('Invalid recipient email'),
  subject: z.string().min(1, 'Subject required').max(200),
  body: z.string().min(1, 'Email body required').max(10000),
  recipientName: z.string().min(1, 'Recipient name required').optional()
});

// Payment schema
const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Invalid currency code'),
  description: z.string().min(1, 'Description required'),
  patientId: uuidSchema.optional(),
  clinicId: uuidSchema.optional()
});

// Clinic management schema
const clinicUpdateSchema = z.object({
  clinicName: z.string().min(2, 'Clinic name required').optional(),
  email: emailSchema.optional(),
  contactPerson: z.string().min(2, 'Contact person required').optional(),
  phone: phoneSchema,
  address: z.string().min(5, 'Address required').optional(),
  city: z.string().min(2, 'City required').optional(),
  state: z.string().min(2, 'State required').optional(),
  zipCode: z.string().optional()
});

// Patient update schema
const patientUpdateSchema = z.object({
  name: z.string().min(2, 'Name required').optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  dateOfBirth: z.coerce.date().optional(),
  medicalHistory: z.string().max(5000).optional()
});

// Password reset schema
const passwordResetRequestSchema = z.object({
  email: emailSchema
});

const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token required'),
  password: passwordSchema
});

// Admin user management
const adminCreateUserSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'clinic', 'patient']),
  name: z.string().min(2, 'Name required').optional(),
  clinicId: uuidSchema.optional()
});

const adminUpdateUserSchema = z.object({
  email: emailSchema.optional(),
  role: z.enum(['admin', 'clinic', 'patient']).optional(),
  name: z.string().min(2, 'Name required').optional(),
  isActive: z.boolean().optional()
});

/**
 * Validation middleware factory
 * @param {object} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} source - Where to validate from
 */
const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validated = await schema.parseAsync(data);

      // Replace with validated data
      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        req.query = validated;
      } else {
        req.params = validated;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

module.exports = {
  // Schemas
  emailSchema,
  passwordSchema,
  phoneSchema,
  uuidSchema,
  fileUploadSchema,
  loginSchema,
  signupSchema,
  clinicSignupSchema,
  qeegUploadSchema,
  reportGenerationSchema,
  emailSendSchema,
  paymentSchema,
  clinicUpdateSchema,
  patientUpdateSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,

  // Middleware factory
  validate
};
