const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { prisma } = require('./database');
const logger = require('../middleware/logger');

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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// =============================================
// GOOGLE OAUTH STRATEGY
// =============================================

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists with this google id
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { googleId: profile.id },
                { email: profile.emails?.[0]?.value }
              ]
            }
          });

          if (user) {
            // Update google id if not set
            if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id }
              });
            }
            return done(null, user);
          }

          // Create new user
          user = await prisma.user.create({
            data: {
              email: profile.emails?.[0]?.value || `${profile.id}@google-oauth.com`,
              name: profile.displayName,
              passwordHash: '',
              googleId: profile.id,
              isEmailVerified: true,
              role: 'customer'
            }
          });

          // Create user profile
          await prisma.userProfile.create({
            data: {
              userId: user.id,
              avatarUrl: profile.photos?.[0]?.value
            }
          });

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
// GITHUB OAUTH STRATEGY
// =============================================

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
        scope: ['user:email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { githubId: profile.id },
                { email: profile.emails?.[0]?.value }
              ]
            }
          });

          if (user) {
            if (!user.githubId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { githubId: profile.id }
              });
            }
            return done(null, user);
          }

          user = await prisma.user.create({
            data: {
              email: profile.emails?.[0]?.value || `${profile.id}@github-oauth.com`,
              name: profile.displayName || profile.username,
              passwordHash: '',
              githubId: profile.id,
              isEmailVerified: true,
              role: 'customer'
            }
          });

          await prisma.userProfile.create({
            data: {
              userId: user.id,
              avatarUrl: profile.photos?.[0]?.value
            }
          });

          return done(null, user);
        } catch (error) {
          logger.error('GitHub OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
  logger.info('✅ GitHub OAuth strategy configured');
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
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/api/auth/facebook/callback',
        profileFields: ['id', 'emails', 'name', 'displayName', 'photos']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { facebookId: profile.id },
                { email: profile.emails?.[0]?.value }
              ]
            }
          });

          if (user) {
            if (!user.facebookId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { facebookId: profile.id }
              });
            }
            return done(null, user);
          }

          user = await prisma.user.create({
            data: {
              email: profile.emails?.[0]?.value || `${profile.id}@facebook-oauth.com`,
              name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
              passwordHash: '',
              facebookId: profile.id,
              isEmailVerified: true,
              role: 'customer'
            }
          });

          await prisma.userProfile.create({
            data: {
              userId: user.id,
              avatarUrl: profile.photos?.[0]?.value
            }
          });

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

// =============================================
// LOCAL STRATEGY (Custom - for JWT based auth)
// =============================================

// This is a placeholder. JWT-based auth is handled separately in authController.

logger.info('✅ Passport configuration loaded');

module.exports = passport;

