// backend/src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const passport = require('passport');
const AuthController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const Validators = require('../utils/validators');

// =============================================
// REGULAR AUTH ROUTES
// =============================================

router.post(
    '/register',
    Validators.validate(Validators.user.register),
    AuthController.register
);

router.post(
    '/login',
    Validators.validate(Validators.user.login),
    AuthController.login
);

router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', protect, AuthController.logout);
router.get('/verify-email/:token', AuthController.verifyEmail);
router.post('/forgot-password', Validators.validate([
    Validators.user.login[0]
]), AuthController.forgotPassword);

router.post(
    '/reset-password/:token',
    Validators.validate([
        Validators.user.register[2],
        Validators.user.register[3]
    ]),
    AuthController.resetPassword
);

router.post(
    '/change-password',
    protect,
    Validators.validate([
        Validators.user.register[2],
        Validators.user.register[3]
    ]),
    AuthController.changePassword
);

router.get('/profile', protect, AuthController.getProfile);
router.put('/profile', protect, Validators.validate(Validators.user.updateProfile), AuthController.updateProfile);

// =============================================
// SOCIAL AUTH ROUTES
// =============================================

// Helper: check if a social strategy is configured
const isStrategyConfigured = (name) => {
    const strategies = {
        google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
        facebook: !!process.env.FACEBOOK_APP_ID && !!process.env.FACEBOOK_APP_SECRET
    };
    return strategies[name] === true;
};

// Middleware: guard social auth routes
const socialGuard = (provider) => {
    return (req, res, next) => {
        if (!isStrategyConfigured(provider)) {
            return res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:3005'}/login?error=${provider}_not_configured`
            );
        }
        next();
    };
};

// Google OAuth
router.get('/google',
    socialGuard('google'),
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })
);

router.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3005'}/login?error=google_auth_failed`,
        session: true
    }),
    (req, res) => {
        try {
            const token = AuthController.generateSocialToken(req.user);
            const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3005'}/social-login?token=${token}`;
            res.redirect(redirectUrl);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/login?error=google_auth_failed`);
        }
    }
);

// GitHub OAuth (removed - not supported)

// Facebook OAuth
router.get('/facebook',
    socialGuard('facebook'),
    passport.authenticate('facebook', { 
        scope: ['email', 'public_profile']
    })
);

router.get('/facebook/callback',
    passport.authenticate('facebook', { 
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3005'}/login?error=facebook_auth_failed`,
        session: true
    }),
    (req, res) => {
        try {
            const token = AuthController.generateSocialToken(req.user);
            const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3005'}/social-login?token=${token}`;
            res.redirect(redirectUrl);
        } catch (error) {
            console.error('Facebook callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3005'}/login?error=facebook_auth_failed`);
        }
    }
);

// Social login callback handler
router.post('/social-login', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                status: 'error',
                message: 'Token is required'
            });
        }
        const user = await AuthController.verifySocialToken(token);
        res.status(200).json({
            status: 'success',
            data: user
        });
    } catch (error) {
        console.error('Social login error:', error);
        res.status(400).json({
            status: 'error',
            message: error.message || 'Social login failed'
        });
    }
});

module.exports = router;