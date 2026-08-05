# Profile Page Implementation — Task Tracker

## Status: IN PROGRESS

### Backend
- [ ] 1. Extend `backend/src/utils/validators.js` — add `preferredLanguage`, `avatarUrl`, `dateOfBirth`, `gender` to `updateProfile`; add address validation rules
- [ ] 2. Extend `backend/src/controllers/authController.js` — persist `avatarUrl`, `dateOfBirth`, `gender`, `preferredLanguage` in `updateProfile`; add address CRUD methods
- [ ] 3. Add REST address routes in `backend/src/routes/userRoutes.js`

### Frontend
- [ ] 4. Add avatar upload + address methods to `frontend/src/js/modules/api.js`
- [ ] 5. Add avatar/address helpers to `frontend/src/js/modules/auth.js`
- [ ] 6. Create `frontend/src/js/pages/ProfilePage.js` (Overview, Edit Profile, Change Password, Addresses tabs)
- [ ] 7. Create `frontend/src/css/profile.css`
- [ ] 8. Wire `ProfilePage` into `frontend/src/js/app.js` `renderProfile`
- [ ] 9. Import `profile.css` in `frontend/src/js/main.js`

### Verification
- [ ] 10. Restart backend + frontend, test all profile tabs
