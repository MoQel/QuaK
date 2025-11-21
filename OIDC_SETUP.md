# OIDC Secure Login Flow Setup Guide

## Overview

This guide will help you set up Google OAuth2/OIDC authentication for the QuaK application using the BFF (Backend for Frontend) pattern with PKCE for enhanced security.

## Features

- ✅ Secure OIDC login with Google
- ✅ Authorization Code + PKCE flow
- ✅ **No tokens in the browser** (HttpOnly session cookies only)
- ✅ Backend-managed tokens
- ✅ Automatic session handling
- ✅ Secure logout

## Prerequisites

1. **Google Cloud Console Account** - You'll need a Google account to create OAuth2 credentials
2. **Java 21** - For the Spring Boot backend
3. **Node.js 18+** - For the React frontend

## Step 1: Set Up Google OAuth2 Credentials

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or Google Identity)

### 1.2 Create OAuth2 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Configure the OAuth consent screen if prompted:
   - Application name: `QuaK`
   - User support email: Your email
   - Authorized domains: `localhost` (for development)
   - Scopes: `openid`, `email`, `profile`
5. Add **Authorized JavaScript origins**:

   ```text
   http://localhost:8080
   ```

6. Add **Authorized redirect URIs**:

   ```text
   http://localhost:8080/login/oauth2/code/google
   ```

7. Click **Create**
8. **Copy the Client ID and Client Secret** - You'll need these in the next step

## Step 2: Configure the Backend

### 2.1 Set Environment Variables

Create a `.env` file in the `backend` directory (or set environment variables):

```bash
# Backend environment variables
OIDC_CLIENT_ID=<your-google-client-id>
OIDC_CLIENT_SECRET=<your-google-client-secret>
OIDC_ISSUER=https://accounts.google.com
FRONTEND_URL=http://localhost:5173
```

You can also use the `.env.example` file as a template.

### 2.2 Verify Configuration

The backend is already configured in `application.properties` to use these environment variables.

## Step 3: Configure the Frontend

### 3.1 Set Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
# Frontend environment variables
VITE_API_URL=http://localhost:8080
```

You can also use the `.env.example` file as a template.

## Step 4: Run the Application

### 4.1 Start the Backend

```bash
cd backend
./gradlew bootRun
```

The backend will start on `http://localhost:8080`

### 4.2 Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## Step 5: Test the Login Flow

1. Open your browser and navigate to `http://localhost:5173`
2. You should be automatically redirected to the login page
3. Click **"Sign in with Google"**
4. You'll be redirected to Google's OAuth2 consent screen
5. Select your Google account and grant permissions
6. You'll be redirected back to the application, now logged in!
7. Your name and profile picture should appear in the navbar
8. Test the logout by clicking the **Logout** button

## Security Features

### PKCE (Proof Key for Code Exchange)

The implementation uses PKCE to protect against authorization code interception attacks:

1. **Code Verifier**: A random string generated on the client
2. **Code Challenge**: SHA-256 hash of the code verifier
3. The challenge is sent during authorization, and the verifier is sent during token exchange

### HttpOnly Session Cookies

- **No tokens in browser storage**: All OAuth2 tokens are stored server-side
- **HttpOnly cookies**: The browser only receives a session cookie with the `HttpOnly` flag
- **CSRF protection**: Built-in Spring Security CSRF protection
- **SameSite policy**: Cookies use `Lax` SameSite policy

### CORS Configuration

CORS is properly configured to only allow requests from the frontend URL (`http://localhost:5173`).

## API Endpoints

### Authentication Endpoints

- `GET /api/auth/status` - Check authentication status (public)
- `GET /api/auth/user` - Get current user info (authenticated)
- `POST /api/auth/logout` - Logout and invalidate session

### OAuth2 Endpoints (Spring Security)

- `GET /oauth2/authorization/google` - Initiate Google login
- `GET /login/oauth2/code/google` - OAuth2 callback (handled by Spring Security)

## Troubleshooting

### Issue: Redirect URI Mismatch

**Error**: `redirect_uri_mismatch` from Google

**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:

```text
http://localhost:8080/login/oauth2/code/google
```

### Issue: CORS Errors

**Error**: CORS policy blocking requests

**Solution**:

- Verify `FRONTEND_URL` is set correctly in backend `.env`
- Ensure frontend is running on the correct port (5173)

### Issue: Session Not Persisting

**Error**: User gets logged out on page refresh

**Solution**:

- Make sure `credentials: 'include'` is set in all fetch requests
- Verify cookies are being set in the browser (check DevTools → Application → Cookies)

### Issue: Google OAuth Consent Screen Shows "App Not Verified"

**Solution**: This is normal during development. Click "Advanced" → "Go to QuaK (unsafe)" to proceed.

## Production Deployment

For production, you'll need to:

1. **Update Google OAuth2 credentials**:
   - Add your production domain to authorized origins
   - Add production callback URL: `https://yourdomain.com/login/oauth2/code/google`

2. **Update environment variables**:

   ```bash
   FRONTEND_URL=https://yourdomain.com
   OIDC_CLIENT_ID=<production-client-id>
   OIDC_CLIENT_SECRET=<production-client-secret>
   ```

3. **Enable secure cookies**:
   In `application.properties`, change:

   ```properties
   server.servlet.session.cookie.secure=true
   ```

4. **Use HTTPS**: Ensure both frontend and backend use HTTPS in production

## Architecture Diagram

```text
┌─────────────┐                    ┌──────────────┐                   ┌──────────────┐
│   Browser   │                    │   Backend    │                   │    Google    │
│  (Frontend) │                    │ (BFF/Spring) │                   │   OAuth2     │
└─────────────┘                    └──────────────┘                   └──────────────┘
       │                                   │                                   │
       │  1. Click "Login with Google"     │                                   │
       ├──────────────────────────────────>│                                   │
       │                                   │                                   │
       │  2. Redirect to Google OAuth      │                                   │
       │      (with PKCE challenge)        │   3. Authorization request        │
       ├───────────────────────────────────┼──────────────────────────────────>│
       │                                   │                                   │
       │  4. User authenticates            │                                   │
       │     & grants consent              │                                   │
       │<──────────────────────────────────┼───────────────────────────────────│
       │                                   │                                   │
       │  5. Redirect back with            │                                   │
       │     authorization code            │                                   │
       ├──────────────────────────────────>│  6. Exchange code for tokens      │
       │                                   │      (with PKCE verifier)         │
       │                                   ├──────────────────────────────────>│
       │                                   │                                   │
       │                                   │  7. Access + ID tokens            │
       │                                   │<──────────────────────────────────│
       │                                   │                                   │
       │  8. Set HttpOnly session cookie   │  (Tokens stored server-side)      │
       │     & redirect to frontend        │                                   │
       │<──────────────────────────────────│                                   │
       │                                   │                                   │
       │  9. API requests with             │                                   │
       │     session cookie                │                                   │
       ├──────────────────────────────────>│                                   │
       │                                   │                                   │
       │  10. Response                     │                                   │
       │<──────────────────────────────────│                                   │
```

## Summary

You now have a fully functional OIDC login system with:

✅ **Secure authentication** using Google OAuth2  
✅ **PKCE protection** against code interception  
✅ **HttpOnly session cookies** (no tokens exposed)  
✅ **Backend token management**  
✅ **Automatic session handling**  
✅ **Clean logout flow**

All acceptance criteria from the feature requirements are met! 🎉
