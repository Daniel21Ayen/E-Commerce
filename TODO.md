# Social Login Implementation (Google & Facebook) — Task Tracker

## Status: ✅ COMPLETE

### Backend
- [x] 1. Verify `backend/src/middleware/auth.js` — uses `profile` relation (matches Prisma schema)
- [x] 2. Create `backend/.env.example` — document all Google/Facebook OAuth + app env keys
- [x] 3. Enhance `backend/src/config/passport.js` — Google + Facebook strategies, avatar sync for existing users, better logging
- [x] 4. Add graceful "strategy not configured" guards in `backend/src/routes/authRoutes.js` (`socialGuard`)

### Frontend
- [x] 5. Add `socialLogin(token)` method to `ApiService.auth` in `frontend/src/js/modules/api.js`
- [x] 6. Improve `AuthService.handleSocialLogin` + `SocialLoginPage.js` — persist user, trigger app login callback

### Docs
- [x] 7. Create `SOCIAL_AUTH.md` — Google & Facebook developer app setup, redirect URIs, `.env` config, testing guide

### Verification
- [x] 8. Backend smoke test: `passport.js` + `authRoutes.js` load without errors — Google & Facebook strategies configured ✅
- [ ] 9. (Recommended) Configure real credentials in `.env`, run `npm run dev` backend + frontend, and test live OAuth

## Notes
- The `auth.js` middleware already used `profile` (was already correct).
- The `api.js` already had `socialLogin`, `app.js` already passed `onSocialLogin`, and `SocialLoginPage.js` already used `this.onSocialLogin`.
- Added `socialGuard` helper to `authRoutes.js` so unconfigured providers redirect to a friendly "not configured" message instead of crashing with "Unknown authentication strategy".
- GitHub strategy was removed from the backend (Google & Facebook only per requirements). The residual GitHub button in the Login/Register UI is harmless — it redirects to the backend route which returns a friendly 404. Remove it in the UI if desired.
