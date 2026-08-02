# Social Login Implementation (Google & Facebook) — Task Tracker

## Approved Plan Steps

### Backend
- [ ] 1. Fix `backend/src/middleware/auth.js` — replace `userProfile` with `profile` in `protect` & `optionalAuth` (match Prisma schema relation)
- [ ] 2. Create `backend/.env.example` — document all Google/Facebook OAuth + app env keys
- [ ] 3. Enhance `backend/src/config/passport.js` — update avatar for existing users, add first/last name mapping, better logging
- [ ] 4. Add graceful "strategy not configured" guards in `backend/src/routes/authRoutes.js`

### Frontend
- [ ] 5. Add `socialLogin(token)` method to `ApiService.auth` in `frontend/src/js/modules/api.js`
- [ ] 6. Improve `AuthService.handleSocialLogin` + `SocialLoginPage.js` — persist user, trigger app login callback

### Docs
- [ ] 7. Create `SOCIAL_AUTH.md` — Google & Facebook developer app setup, redirect URIs, `.env` config, testing guide

### Verification
- [ ] 8. Run backend (prisma generate, server) & frontend (vite dev) to verify no startup errors

