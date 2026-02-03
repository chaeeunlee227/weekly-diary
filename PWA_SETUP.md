# PWA Setup - Quick Start Guide

Your app is now configured for Progressive Web App (PWA) deployment! Follow these steps to complete the setup.

## ✅ What's Already Done

- ✅ PWA plugin added to `package.json`
- ✅ Vite config updated with PWA settings
- ✅ HTML updated with PWA meta tags
- ✅ Service worker will be auto-generated on build

## 📋 Next Steps

### 1. Install Dependencies

```bash
npm install
```

This will install `vite-plugin-pwa` that was added to your `package.json`.

### 2. Create App Icons

You need to create two icon files in the `public` folder:

- **`public/icon-192.png`** - 192x192 pixels
- **`public/icon-512.png`** - 512x512 pixels

**Quick ways to create icons:**

**Option A: Online Tools**
- Visit https://realfavicongenerator.net/
- Upload a square image (at least 512x512)
- Download the generated icons
- Place `icon-192.png` and `icon-512.png` in the `public` folder

**Option B: Use an Image Editor**
- Create a square image (512x512 recommended)
- Export as PNG at 192x192 and 512x512 sizes
- Save to `public/icon-192.png` and `public/icon-512.png`

**Option C: Temporary Placeholder**
- You can use any square image temporarily
- The app will work, but icons won't look perfect

### 3. Build Your App

```bash
npm run build
```

This creates a `build` folder with your PWA-ready app.

### 4. Test Locally

```bash
npm run dev
```

Then on your mobile device (same WiFi network):
1. Find your computer's IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```
2. Open `http://YOUR_IP:3000` on your mobile browser
3. Look for "Add to Home Screen" option

### 5. Deploy to Production

Choose a hosting platform and deploy the `build` folder:

**Netlify (Easiest):**
1. Go to https://app.netlify.com
2. Drag and drop the `build` folder
3. Your app is live! Share the URL

**Vercel:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

**GitHub Pages:**
1. Push `build` folder to `gh-pages` branch
2. Enable GitHub Pages in repo settings
3. Your app will be at `https://YOUR_USERNAME.github.io/REPO_NAME`

## 📱 Installing on Mobile

After deployment:

**iOS (Safari):**
1. Open your deployed URL in Safari
2. Tap the Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

**Android (Chrome):**
1. Open your deployed URL in Chrome
2. Tap the menu (3 dots)
3. Tap "Add to Home screen" or "Install app"
4. Tap "Install"

## 🎉 You're Done!

Your Weekly Diary App is now installable on mobile devices as a PWA!

## Troubleshooting

**Icons not showing?**
- Make sure icons are in the `public` folder
- Rebuild: `npm run build`
- Clear browser cache

**Service worker not working?**
- Make sure you're accessing via HTTPS (or localhost)
- Check browser console for errors
- The plugin auto-generates the service worker on build

**Can't install on iOS?**
- Make sure you're using Safari (not Chrome)
- The site must be served over HTTPS (or localhost)

Need help? Check `MOBILE_DEPLOYMENT.md` for more detailed information.
