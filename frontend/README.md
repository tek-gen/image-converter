# Frontend Setup

This frontend relies on Firebase for authentication and usage tracking.
Sensitive credentials are not stored in version control. To run the frontend you
must provide them in a local `env.js` file.

## Configuration

1. Copy `env.example.js` to `env.js` inside the `frontend` folder.
2. Fill in your Firebase project values in `env.js`:
   ```javascript
   window.env = {
     FIREBASE_API_KEY: "<your-api-key>",
     FIREBASE_AUTH_DOMAIN: "<your-auth-domain>",
     FIREBASE_PROJECT_ID: "<your-project-id>",
     FIREBASE_STORAGE_BUCKET: "<your-storage-bucket>",
     FIREBASE_MESSAGING_SENDER_ID: "<your-messaging-sender-id>",
     FIREBASE_APP_ID: "<your-app-id>"
   };
   ```
3. The `env.js` file is ignored by Git thanks to the rule in `.gitignore`.
4. Once provided, open `index.html` in your browser to use the application.
