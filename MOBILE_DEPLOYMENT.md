# Mobile Deployment Guide for Weekly Diary App

This guide covers two main approaches to deploy your app on mobile devices.

## Option 1: Progressive Web App (PWA) - Recommended for Quick Start

PWAs allow users to install your web app on their mobile devices directly from the browser.

### Setup Steps:

1. **Install PWA plugin** (optional but recommended):
```bash
npm install -D vite-plugin-pwa
```

2. **Update your `vite.config.ts`**:
   - See `vite.config.pwa.ts` for a sample configuration
   - Replace your current vite.config.ts with the PWA version

3. **Update `index.html`** to include manifest and meta tags:
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#ffffff" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Weekly Diary" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <title>Weekly Diary App</title>
</head>
```

4. **Create app icons**:
   - Create `public/icon-192.png` (192x192 pixels)
   - Create `public/icon-512.png` (512x512 pixels)
   - You can use online tools like https://realfavicongenerator.net/

5. **Register Service Worker** (if using manual setup):
   - Add to `src/main.tsx`:
```typescript
import { registerSW } from './registerSW';
registerSW();
```

6. **Build and deploy**:
```bash
npm run build
# Deploy the 'build' folder to any web hosting service
```

7. **Test on mobile**:
   - Deploy to a web server (GitHub Pages, Netlify, Vercel, etc.)
   - Open the URL on your mobile device
   - Look for "Add to Home Screen" option in browser menu

### Hosting Options:
- **Netlify**: Connect your GitHub repo, auto-deploys
- **Vercel**: Similar to Netlify, great for React apps
- **GitHub Pages**: Free hosting for static sites
- **Firebase Hosting**: Google's hosting service

---

## Option 2: Capacitor (Native App)

Capacitor wraps your web app in a native container, allowing you to publish to App Store and Google Play.

### Setup Steps:

1. **Install Capacitor**:
```bash
npm install @capacitor/core @capacitor/cli
npm install -D @capacitor/ios @capacitor/android
```

2. **Initialize Capacitor**:
```bash
npx cap init
# Follow prompts:
# - App name: Weekly Diary
# - App ID: com.weeklydiary.app
# - Web dir: build
```

3. **Update `package.json`** scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "cap:add:ios": "npx cap add ios",
    "cap:add:android": "npx cap add android",
    "cap:sync": "npx cap sync",
    "cap:open:ios": "npx cap open ios",
    "cap:open:android": "npx cap open android"
  }
}
```

4. **Build your app**:
```bash
npm run build
```

5. **Add platforms**:
```bash
npm run cap:add:ios      # For iOS
npm run cap:add:android  # For Android
```

6. **Sync Capacitor**:
```bash
npm run cap:sync
```

7. **Open in native IDEs**:
```bash
npm run cap:open:ios      # Opens Xcode (macOS only)
npm run cap:open:android  # Opens Android Studio
```

8. **Build and publish**:
   - **iOS**: Use Xcode to build and submit to App Store
   - **Android**: Use Android Studio to build APK/AAB and submit to Google Play

### Requirements:
- **iOS**: macOS with Xcode installed
- **Android**: Android Studio installed
- **Apple Developer Account**: $99/year for App Store
- **Google Play Developer Account**: $25 one-time fee

---

## Option 3: Simple Web Deployment (Mobile Browser)

The simplest option - just deploy your built app to a web server and access it via mobile browser.

### Steps:

1. **Build your app**:
```bash
npm run build
```

2. **Deploy the `build` folder** to any static hosting:
   - Netlify: Drag and drop the build folder
   - Vercel: Connect repo or deploy folder
   - GitHub Pages: Push build folder to gh-pages branch
   - Firebase Hosting: `firebase deploy`

3. **Access on mobile**: Open the deployed URL in mobile browser

---

## Recommended Approach

For your Weekly Diary App, I recommend **Option 1 (PWA)** because:
- ✅ Quick to set up
- ✅ Works on both iOS and Android
- ✅ No app store approval needed
- ✅ Users can install it like a native app
- ✅ Free to deploy
- ✅ Your app already has mobile-responsive design

The app will work great as a PWA since it's already designed with mobile in mind (`max-w-md`, responsive classes).

---

## Testing Locally on Mobile

1. **Find your local IP**:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

2. **Update Vite config** to allow external access:
```typescript
server: {
  host: '0.0.0.0',  // Allow external connections
  port: 3000,
}
```

3. **Run dev server**:
```bash
npm run dev
```

4. **Access from mobile**: `http://YOUR_IP:3000` (same WiFi network)

---

## Next Steps

1. Choose your deployment method (PWA recommended)
2. Create app icons (192x192 and 512x512 PNG files)
3. Update configuration files as shown above
4. Build and deploy!

