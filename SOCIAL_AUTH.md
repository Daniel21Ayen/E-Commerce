# Social Login (Google & Facebook) — Setup Guide

This guide explains how to configure **Google**, **Facebook** (and optional **GitHub**) OAuth login for the E-Commerce app.

## 🔧 How the Flow Works

1. User clicks a **Google/Facebook** button on the Login/Register page.
2. Frontend redirects to `GET /api/auth/{provider}` (backend).
3. Backend's Passport strategy redirects the user to the provider's consent screen.
4. After the user authorizes, the provider redirects back to the backend callback URL.
5. Backend creates-or-finds the user (sets `googleId`/`facebookId`), generates a JWT, and redirects to:
   ```
   {FRONTEND_URL}/social-login?token={JWT}
   ```
6. `SocialLoginPage.js` consumes the token via `POST /api/auth/social-login`, stores auth state, updates the header UI, and redirects to `/`.

If the provider is **not configured**, the backend redirects to `/login?error={provider}_not_configured`, and the frontend shows a friendly message.

---

## 1. Google Setup

### Create OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or use an existing one).
3. Go to **APIs & Services → OAuth consent screen**.
   - User type: **External**.
   - Add your app name and support email.
   - **Scopes**: `email`, `profile`, `openid`.
   - Add yourself as a **Test user** (or publish the app).
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: `http://localhost:3005`
   - **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback`
5. Copy the **Client ID** and **Client Secret**.

### Add to `.env`
```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

---

## 2. Facebook Setup

### Create an App
1. Go to [Facebook Developers](https://developers.facebook.com/apps).
2. Create a new app (type: **Consumer** or **Business**).
3. Add the **Facebook Login** product to your app.
4. In **Facebook Login → Settings**:
   - **Valid OAuth Redirect URIs**: `http://localhost:5000/api/auth/facebook/callback`
5. Copy the **App ID** and **App Secret** (from **App Settings → Basic**).

### Add to `.env`
```env
FACEBOOK_APP_ID=xxxxxxxxxxxxxxx
FACEBOOK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback
```

> ⚠️ Facebook requires a **public HTTPS URL** for production. For local testing, `http://localhost` works, but you must add the exact redirect URI and use a test user.

---

## 3. GitHub Setup (Optional)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. **New OAuth App**:
   - Homepage URL: `http://localhost:3005`
   - Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
3. Copy the **Client ID** and **Client Secret**.

```env
GITHUB_CLIENT_ID=xxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxx
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

---

## 4. Required Environment Variables

```env
# Backend
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3005
JWT_SECRET=<long-random-secret>

# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Facebook
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# GitHub (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

---

## 5. Running the App

### Backend
```bash
cd backend
cp .env.example .env      # then fill in your values
npm install
npx prisma generate
npx prisma migrate dev
npm run dev               # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:3005
```

---

## 6. Testing the Flow

1. Open `http://localhost:3005/login`.
2. Click **Google** → authorize → you should be redirected home and logged in (see your name in the header).
3. Sign out and try **Facebook** the same way.
4. If a provider is **not configured**, clicking its button shows: *"X login is not configured yet. Please use email registration."* and redirects to `/login`.

### Troubleshooting
| Symptom | Likely cause / fix |
|---------|--------------------|
| `Unknown authentication strategy "google"` | `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` not set in `.env`. |
| `redirect_uri_mismatch` | The callback URL in the provider console doesn't exactly match `GOOGLE_CALLBACK_URL`. |
| `Invalid redirect URI` (Facebook) | Add the exact OAuth redirect URI in the Facebook app settings. |
| User logged out immediately after login | Check `protect` middleware queries the `profile` relation (already fixed). |
| `socialLogin is not a function` | Frontend `api.js` is missing the `socialLogin` method (already fixed). |

---

## 7. Notes

- The `User` model already has `googleId`, `facebookId`, and `githubId` columns.
- If a user signs up with email first, then logs in with the same email via a provider, the provider ID is linked to the existing account (no duplicate).
- Passport session storage uses Redis when available (`connect-redis`), else falls back to in-memory.
