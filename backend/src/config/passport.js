// backend/src/config/passport.js

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { prisma } = require('./database');
const logger = require('../middleware/logger');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Generate random password for social users
const generateRandomPassword = () => {
    return crypto.randomBytes(20).toString('hex');
};

// =============================================
// PASSPORT SERIALIZATION
// =============================================

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                profile: true
            }
        });
        done(null, user);
    } catch (error) {
        logger.error('Deserialize user error:', error);
        done(error, null);
    }
});

// =============================================
// HELPER: Find or Create User
// =============================================

const findOrCreateSocialUser = async (profile, provider) => {
    const providerId = profile.id;
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || profile.name?.givenName || `${provider} User`;
    const avatar = profile.photos?.[0]?.value;

    // Build search conditions
    const searchConditions = [];
    if (providerId) {
        searchConditions.push({ [`${provider}Id`]: providerId });
    }
    if (email) {
        searchConditions.push({ email });
    }

    // Find existing user
    let user = null;
    if (searchConditions.length > 0) {
        user = await prisma.user.findFirst({
            where: {
                OR: searchConditions
            },
            include: {
                profile: true
            }
        });
    }

    if (user) {
        // Update provider ID / email verification / avatar if not set
        const updateData = {};
        if (!user[`${provider}Id`]) {
            updateData[`${provider}Id`] = providerId;
        }
        if (!user.isEmailVerified) {
            updateData.isEmailVerified = true;
        }
        if (!user.profile?.avatarUrl && avatar) {
            updateData.profile = {
                update: {
                    avatarUrl: avatar
                }
            };
        }
        
        if (Object.keys(updateData).length > 0) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: updateData,
                include: { profile: true }
            });
        }
        return user;
    }

    // Create new user
    const randomPassword = generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    const userData = {
        email: email || `${providerId}@${provider}.user`,
        passwordHash,
        name: name,
        [`${provider}Id`]: providerId,
        isEmailVerified: true,
        isActive: true,
        role: 'customer',
        profile: {
            create: {
                avatarUrl: avatar || null,
                preferredLanguage: 'en'
            }
        }
    };

    user = await prisma.user.create({
        data: userData,
        include: {
            profile: true
        }
    });

    return user;
};

// =============================================
// GOOGLE OAUTH STRATEGY
// =============================================

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 
                    `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
                scope: ['profile', 'email'],
                proxy: true
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const user = await findOrCreateSocialUser(profile, 'google');
                    logger.info(`Google OAuth user: ${user.email} (${user.id})`);
                    return done(null, user);
                } catch (error) {
                    logger.error('Google OAuth error:', error);
                    return done(error, null);
                }
            }
        )
    );
    logger.info('✅ Google OAuth strategy configured');
}

// =============================================
// FACEBOOK OAUTH STRATEGY
// =============================================

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
        new FacebookStrategy(
            {
                clientID: process.env.FACEBOOK_APP_ID,
                clientSecret: process.env.FACEBOOK_APP_SECRET,
                callbackURL: process.env.FACEBOOK_CALLBACK_URL || 
                    `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
                profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
                proxy: true
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const user = await findOrCreateSocialUser(profile, 'facebook');
                    logger.info(`Facebook OAuth user: ${user.email} (${user.id})`);
                    return done(null, user);
                } catch (error) {
                    logger.error('Facebook OAuth error:', error);
                    return done(error, null);
                }
            }
        )
    );
    logger.info('✅ Facebook OAuth strategy configured');
}

logger.info('✅ Passport configuration loaded');

module.exports = passport;