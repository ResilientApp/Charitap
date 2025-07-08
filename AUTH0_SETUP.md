# Auth0 Integration Setup Guide

This guide will help you set up Auth0 authentication for the Charitap application.

## Prerequisites

1. An Auth0 account (sign up at [auth0.com](https://auth0.com))
2. Node.js and npm installed
3. The Charitap project cloned and dependencies installed

## Step 1: Create an Auth0 Application

1. **Log in to Auth0 Dashboard**
   - Go to [manage.auth0.com](https://manage.auth0.com)
   - Sign in to your Auth0 account

2. **Create a New Application**
   - Click "Applications" in the left sidebar
   - Click "Create Application"
   - Name: `Charitap Web App`
   - Type: `Single Page Application`
   - Click "Create"

3. **Configure Application Settings**
   - In your new application, go to the "Settings" tab
   - Note down the following values:
     - **Domain** (e.g., `your-tenant.auth0.com`)
     - **Client ID** (a long string of characters)

4. **Configure Allowed URLs**
   - **Allowed Callback URLs**: `http://localhost:3008,http://localhost:3000`
   - **Allowed Logout URLs**: `http://localhost:3008,http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3008,http://localhost:3000`
   - Click "Save Changes"

## Step 2: Environment Configuration

1. **Create Environment File**
   - In your project root, create a `.env` file
   - Add the following content:

```env
# Auth0 Configuration
REACT_APP_AUTH0_DOMAIN=your-auth0-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-auth0-client-id

# Optional: Additional Auth0 settings
# REACT_APP_AUTH0_AUDIENCE=your-api-identifier
# REACT_APP_AUTH0_SCOPE=openid profile email
```

2. **Replace Placeholder Values**
   - Replace `your-auth0-domain.auth0.com` with your actual Auth0 domain
   - Replace `your-auth0-client-id` with your actual Client ID

## Step 3: Test the Integration

1. **Start the Development Server**
   ```bash
   npm start
   ```

2. **Test Authentication Flow**
   - Open `http://localhost:3008` in your browser
   - Click "Join Now" or "Add to Chrome" button
   - You should be redirected to Auth0 login/signup page
   - After authentication, you should be redirected back to the app

## Step 4: Configure Auth0 Rules (Optional)

You can add custom rules in Auth0 to enhance user experience:

1. **Go to Auth0 Dashboard**
   - Navigate to "Auth Pipeline" > "Rules"
   - Click "Create Rule"

2. **Example Rule: Add User Metadata**
   ```javascript
   function (user, context, callback) {
     // Add custom user metadata
     user.user_metadata = user.user_metadata || {};
     user.user_metadata.last_login = new Date().toISOString();
     
     callback(null, user, context);
   }
   ```

## Troubleshooting

### Common Issues

1. **"Invalid redirect_uri" Error**
   - Ensure your callback URLs are correctly configured in Auth0
   - Check that the port number matches your development server

2. **Environment Variables Not Loading**
   - Restart your development server after creating the `.env` file
   - Ensure the `.env` file is in the project root directory
   - Check that variable names start with `REACT_APP_`

3. **Authentication Not Working**
   - Verify your Auth0 domain and client ID are correct
   - Check browser console for any error messages
   - Ensure your Auth0 application is not in "Disabled" state

### Debug Mode

To enable debug logging, add this to your `.env` file:
```env
REACT_APP_AUTH0_DEBUG=true
```

## Production Deployment

When deploying to production:

1. **Update Auth0 Settings**
   - Add your production domain to allowed URLs
   - Update callback URLs to include your production domain

2. **Environment Variables**
   - Set production environment variables in your hosting platform
   - Never commit `.env` files to version control

3. **Security Considerations**
   - Use HTTPS in production
   - Configure proper CORS settings
   - Set up proper session management

## Features Implemented

- ✅ User authentication and authorization
- ✅ Protected routes (Dashboard, Activity, Settings)
- ✅ User profile information display
- ✅ Login/logout functionality
- ✅ Persistent sessions with refresh tokens
- ✅ Responsive authentication UI
- ✅ Error handling and user feedback

## Support

If you encounter issues:

1. Check the [Auth0 Documentation](https://auth0.com/docs)
2. Review the [React SDK Documentation](https://auth0.com/docs/libraries/auth0-react)
3. Check browser console for error messages
4. Verify your Auth0 application configuration 