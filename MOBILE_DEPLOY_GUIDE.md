# SBLMS - Free Mobile App Deployment Guide

## Your Free Options

| Platform | Method | Cost | Install Link |
|----------|--------|------|-------------|
| **Android** | APK via Expo EAS | **FREE** | Download link |
| **iOS + Android** | PWA (Web App) | **FREE** | `https://your-domain.pages.dev` |

---

## Option 1: Android APK (FREE)

### Prerequisites
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo (create free account at expo.dev)
eas login
```

### Build APK
```bash
cd mobile

# Build APK (free - 30 builds/month)
eas build --platform android --profile preview
```

### What Happens
1. Expo builds your APK in the cloud (5-10 min)
2. You get a **download link**
3. Share the link with Android users
4. Users download & install directly (enable "Unknown Sources")

### Share the APK
```
Send this link to Android users:
https://expo.dev/artifacts/eas/[build-id].apk
```

---

## Option 2: PWA - Works on BOTH iOS & Android (FREE)

Your frontend is already a PWA. Deploy to Cloudflare Pages:

### Deploy
```bash
cd /Users/csridaran/Projects/SBLMS

git add .
git commit -m "feat: PWA + lazy loading"
git push origin main
```

Then connect to Cloudflare Pages.

### Users Install Like This

#### Android (Chrome)
1. Open `https://your-domain.pages.dev`
2. Tap **3-dot menu** → **"Add to Home screen"**
3. ✅ App installed!

#### iOS (Safari)
1. Open `https://your-domain.pages.dev` in Safari
2. Tap **Share** → **"Add to Home Screen"**
3. ✅ App installed!

---

## Comparison

| Feature | Android APK | PWA (Both Platforms) |
|---------|-------------|---------------------|
| Cost | FREE | FREE |
| Android install | ✅ | ✅ |
| iOS install | ❌ ($99/yr) | ✅ |
| Push notifications | ✅ | ✅ |
| Offline mode | ✅ | ✅ |
| Camera/Face ID | ✅ | ✅ |
| App store listing | ❌ | ❌ |
| Auto updates | ❌ (manual) | ✅ (automatic) |

---

## Quick Start

### For Android Only
```bash
cd mobile
eas login
eas build --platform android --profile preview
# Share the download link
```

### For Both iOS & Android
```bash
# Deploy PWA to Cloudflare Pages
git push origin main
# Share: https://your-domain.pages.dev
```

---

## Your API URL

Update `mobile/src/config.ts` with your backend URL:

```typescript
const API_BASE_URL = __DEV__ ? `http://${DEV_HOST}:5080` : 'https://sblms-api.onrender.com';
```

This is already configured correctly!

---

## Sharing Your App

### Share PWA Link (Both Platforms)
```
https://sblms-[your-name].pages.dev
```

### Share APK (Android Only)
Build with `eas build` → Share the download link from Expo dashboard.

---

## Recommended Approach

1. **Deploy PWA first** → Works on both iOS & Android immediately
2. **Build Android APK** → For users who want native experience
3. **iOS native later** → When you're ready to pay $99/yr for Apple Dev

**Start with PWA - it's free and works on both platforms now!**