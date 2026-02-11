/**
 * Input Validation Middleware
 * Validates request data using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }

    next();
};

/**
 * Roundup validation rules
 */
const validateRoundup = [
    body('purchaseAmount')
        .isFloat({ min: 0.01, max: 10000 })
        .withMessage('Purchase amount must be between $0.01 and $10,000'),
    body('roundUpAmount')
        .isFloat({ min: 0.01, max: 100 })
        .withMessage('Roundup amount must be between $0.01 and $100'),
    body('roundUpAmount')
        .custom((value, { req }) => {
            if (value > req.body.purchaseAmount) {
                throw new Error('Roundup amount cannot exceed purchase amount');
            }
            return true;
        }),
    handleValidationErrors
];

/**
 * User registration validation
 */
const validateSignup = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*]/)
        .withMessage('Password must contain at least one special character'),
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    handleValidationErrors
];

/**
 * Login validation
 */
const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

/**
 * Password change validation
 */
const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/[a-z]/)
        .withMessage('New password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('New password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('New password must contain at least one number')
        .matches(/[!@#$%^&*]/)
        .withMessage('New password must contain at least one special character'),
    handleValidationErrors
];

/**
 * Charity selection validation
 */
const validateCharitySelection = [
    body('charityId')
        .notEmpty()
        .withMessage('Charity ID is required')
        .isMongoId()
        .withMessage('Invalid charity ID format'),
    handleValidationErrors
];

/**
 * Payment preference validation
 */
const validatePaymentPreference = [
    body('paymentPreference')
        .isIn(['threshold', 'monthly'])
        .withMessage('Payment preference must be either "threshold" or "monthly"'),
    handleValidationErrors
];

/**
 * MongoDB ID validation
 */
const validateMongoId = (paramName = 'id') => [
    param(paramName)
        .isMongoId()
        .withMessage(`Invalid ${paramName} format`),
    handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

module.exports = {
    validateRoundup,
    validateSignup,
    validateLogin,
    validatePasswordChange,
    validateCharitySelection,
    validatePaymentPreference,
    validateMongoId,
    validatePagination,
    handleValidationErrors
};
