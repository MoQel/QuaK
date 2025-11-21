# QuaK - OIDC Authentication Feature

## 🎉 Implementation Complete

This document provides a quick overview of the newly implemented OIDC Secure Login Flow for the QuaK quantum computing platform.

## ✨ What Was Implemented

### Secure Google OAuth2/OIDC Login

- **Login with Google** - Users can sign in using their Google account
- **BFF (Backend for Frontend) Pattern** - Backend manages all OAuth tokens
- **PKCE Security** - Enhanced security with Proof Key for Code Exchange
- **HttpOnly Session Cookies** - No tokens exposed to the browser
- **Secure Logout** - Proper session invalidation

## 🖼️ Login Page Preview

The new login page features a modern, premium design:

![Login Page Preview](../brain/df901be3-f1c2-4de7-b53e-3796f3c3d036/login_page_preview_1763735040787.png)

## 🏗️ Architecture

![Architecture Diagram](../brain/df901be3-f1c2-4de7-b53e-3796f3c3d036/oidc_architecture_diagram_1763735088049.png)

### Flow Overview

1. User clicks "Login with Google" on the frontend
2. Frontend redirects to backend OAuth endpoint
3. Backend generates PKCE challenge and redirects to Google
4. User authenticates at Google
5. Google redirects back with authorization code
6. Backend exchanges code for tokens (server-side only)
7. Backend creates session with HttpOnly cookie
8. User can now access protected routes

## 🔒 Security Features

| Feature | Description |
|---------|-------------|
| **PKCE** | Protects against authorization code interception attacks |
| **HttpOnly Cookies** | Session cookies can't be accessed by JavaScript (XSS protection) |
| **No Tokens in Browser** | All OAuth2 tokens stored server-side only |
| **CORS Protection** | Requests only allowed from configured frontend URL |
| **CSRF Protection** | Built-in Spring Security CSRF tokens |
| **Session Timeout** | 30-minute automatic timeout for inactive sessions |

## 📋 Quick Start Guide

### 1️⃣ Set Up Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable Google+ API
4. Create OAuth2 credentials:
   - **Authorized origins**: `http://localhost:8080`
   - **Redirect URIs**: `http://localhost:8080/login/oauth2/code/google`
5. Copy your **Client ID** and **Client Secret**

### 2️⃣ Configure Environment Variables

**Backend** - Create `backend/.env`:

```bash
OIDC_CLIENT_ID=your-google-client-id-here
OIDC_CLIENT_SECRET=your-google-client-secret-here
OIDC_ISSUER=https://accounts.google.com
FRONTEND_URL=http://localhost:5173
```

**Frontend** - Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:8080
```

### 3️⃣ Run the Application

**Terminal 1 - Backend:**

```bash
cd backend
./gradlew bootRun
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### 4️⃣ Test It Out

1. Open browser at `http://localhost:5173`
2. You'll see the login page
3. Click "Sign in with Google"
4. Authenticate with your Google account
5. You're in! 🎉

## 📚 Documentation

Detailed documentation is available:

- **[OIDC_SETUP.md](./OIDC_SETUP.md)** - Complete setup guide with troubleshooting
- **[OIDC_IMPLEMENTATION_SUMMARY.md](./OIDC_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details

## 🧪 Testing Checklist

Before deploying, verify:

- [ ] Login with Google works end-to-end
- [ ] User info (name, email, picture) displays in navbar
- [ ] Protected routes redirect to login when not authenticated
- [ ] Authenticated users can access all routes
- [ ] Logout clears session and redirects to login
- [ ] Session persists across page refreshes
- [ ] Session expires after 30 minutes of inactivity
- [ ] No OAuth tokens visible in browser DevTools
- [ ] Session cookie has HttpOnly flag set

## 🎯 API Endpoints

### Authentication Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/status` | GET | No | Check if user is authenticated |
| `/api/auth/user` | GET | Yes | Get current user information |
| `/api/auth/logout` | POST | Yes | Logout and invalidate session |

### OAuth2 Endpoints (Spring Security)

| Endpoint | Description |
|----------|-------------|
| `/oauth2/authorization/google` | Initiates Google OAuth2 login flow |
| `/login/oauth2/code/google` | OAuth2 callback endpoint (handled by Spring) |

## 🛠️ Development Tips

### Using the API Utility

The frontend includes a utility for making authenticated requests:

```typescript
import { api } from '@/utils/api';

// GET request
const projects = await api.get<Project[]>('/api/projects');

// POST request
const newProject = await api.post<Project>('/api/projects', {
  name: 'My Quantum Project'
});

// All requests automatically include session cookie!
```

### Checking Auth Status

In any React component:

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🚀 Production Deployment

When deploying to production:

1. **Update Google OAuth2 credentials**:
   - Add production domain to authorized origins
   - Add production callback URL

2. **Update environment variables**:
   - Set `FRONTEND_URL` to production URL
   - Set `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET` for production

3. **Enable secure cookies**:
   - Set `server.servlet.session.cookie.secure=true` in `application.properties`

4. **Use HTTPS**:
   - Ensure both frontend and backend use HTTPS in production

## 📁 File Structure

```text
QuaK/
├── backend/
│   ├── src/main/java/edu/kit/quak/security/
│   │   ├── SecurityConfig.java          # OAuth2 & Security config
│   │   ├── AuthController.java          # Auth REST endpoints
│   │   └── model/
│   │       └── UserInfo.java            # User model
│   ├── src/main/resources/
│   │   └── application.properties       # Spring Boot config
│   ├── .env.example                     # Example env vars
│   └── build.gradle                     # Dependencies
│
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx          # Auth state management
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx       # Route protection
│   │   │   └── Navbar.tsx               # With user info & logout
│   │   ├── utils/
│   │   │   └── api.ts                   # Authenticated API calls
│   │   ├── pages/
│   │   │   └── LogIn.tsx                # Login page
│   │   └── router.tsx                   # Route configuration
│   └── .env.example                     # Example env vars
│
├── OIDC_SETUP.md                        # Setup guide
├── OIDC_IMPLEMENTATION_SUMMARY.md       # Implementation details
└── README_OIDC.md                       # This file
```

## ❓ FAQ

**Q: Do I need to configure CORS separately?**  
A: No, CORS is automatically configured based on the `FRONTEND_URL` environment variable.

**Q: Can users access the app without logging in?**  
A: No, all routes except `/login` are protected and require authentication.

**Q: Where are the OAuth tokens stored?**  
A: All tokens are stored server-side in the Spring Security session. The browser only has an HttpOnly session cookie.

**Q: How do I add more OAuth providers (GitHub, Microsoft, etc.)?**  
A: You can add additional providers in `application.properties` and update the login page to show multiple options.

**Q: What happens when the session expires?**  
A: The user will be automatically redirected to the login page when they try to access any protected resource.

## 🐛 Troubleshooting

### Issue: "redirect_uri_mismatch" error from Google

**Solution**: Verify the redirect URI in Google Cloud Console matches exactly:

```text
http://localhost:8080/login/oauth2/code/google
```

### Issue: CORS errors in browser console

**Solution**:

- Check `FRONTEND_URL` in backend `.env` matches where your frontend is running
- Ensure frontend is running on `http://localhost:5173`

### Issue: Session not persisting

**Solution**:

- Verify `credentials: 'include'` is set in fetch requests (the `api` utility does this automatically)
- Check browser cookies - you should see `JSESSIONID` cookie with HttpOnly flag

## 🎓 Next Steps

Optional enhancements you could add:

1. **Database Session Storage** - Use Spring Session JDBC/Redis for scalable session management
2. **Remember Me** - Implement "stay signed in" functionality
3. **Multi-Provider Support** - Add GitHub, Microsoft, etc.
4. **User Profile Management** - Allow users to update their profile
5. **Admin Panel** - User management and analytics
6. **Audit Logging** - Track login/logout events
7. **Rate Limiting** - Prevent brute force attacks

## 🙏 Support

For help:

1. Check [OIDC_SETUP.md](./OIDC_SETUP.md) troubleshooting section
2. Verify environment variables are set correctly
3. Check browser DevTools console for errors
4. Review backend logs for Spring Security errors

---

**Implementation Date**: November 21, 2025  
**Status**: ✅ Complete and Ready for Use  
**Security Level**: Production-Ready with PKCE + HttpOnly Cookies
