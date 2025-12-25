# Appwrite Authentication Setup Guide

This application uses [Appwrite Cloud](https://cloud.appwrite.io) for authentication.

## Setup Instructions

### 1. Create an Appwrite Account
1. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
2. Sign up for a free account

### 2. Create a New Project
1. Click "Create Project"
2. Give it a name (e.g., "SonicFlow")
3. Copy your **Project ID** - you'll need this

### 3. Configure Authentication
1. Navigate to **Auth** in the left sidebar
2. Click on **Settings**
3. Add your app's URL to "Platforms" section:
   - Platform: **Web**
   - Name: `SonicFlow (localhost)`
   - Hostname: `localhost`
   - Click **Next** and **Add**

### 4. Configure Environment Variables
Create a `.env.local` file in your project root with the following content:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
```

Replace `your_project_id_here` with your actual Project ID from step 2.

### 5. Run the Application
```bash
npm run dev
```

Your app should now be running with fully functional authentication!

## Features

✅ **Email/Password Sign Up** - Create new accounts
✅ **Email/Password Sign In** - Authenticate existing users  
✅ **Session Management** - Persistent login across page refreshes
✅ **Secure by Default** - Passwords hashed with Argon2
✅ **Error Handling** - User-friendly error messages

## Usage

### Sign Up
1. Click "Sign In" button in header
2. Click "Sign up" link at the bottom
3. Fill in name, email, and password
4. Click "Create Account"

### Sign In
1. Click "Sign In" button in header
2. Enter email and password
3. Click "Sign In"

### Sign Out
- User menu will appear when authenticated (you can implement this next)

## Next Steps

You can extend this by:
- Adding a user profile page
- Implementing sign out functionality
- Adding email verification
- Implementing password reset
- Adding OAuth providers (Google, GitHub, etc.)

## Troubleshooting

**Error: "Invalid credentials"**
- Check that NEXT_PUBLIC_APPWRITE_PROJECT_ID is correct
- Ensure you've added localhost to your Appwrite platform settings

**Error: "Failed to create account"**
- Email might already be in use
- Password must be at least 8 characters

For more help, visit [Appwrite Documentation](https://appwrite.io/docs)
