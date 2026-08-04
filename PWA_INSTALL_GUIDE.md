# SBLMS PWA - Install on iOS & Android (FREE)

## 📱 Android Installation (APK Alternative)

### Option 1: Install as PWA (Recommended)
1. Open **Chrome** on your Android
2. Go to your SBLMS URL (e.g., `https://sblms.pages.dev`)
3. Tap the **3-dot menu** → **"Add to Home screen"**
4. Tap **"Add"** when prompted
5. ✅ App is now installed! Works offline too.

### Option 2: Download APK (Requires Build)
```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK (free - 30 builds/month)
eas build --platform android --profile preview

# Download APK from the link provided
# Install on Android (enable "Unknown Sources" in settings)
```

---

## 🍎 iOS Installation (FREE via PWA)

**No Apple Developer account needed!**

### Steps:
1. Open **Safari** on your iPhone/iPad
2. Go to your SBLMS URL (e.g., `https://sblms.pages.dev`)
3. Tap the **Share button** (box with arrow)
4. Scroll down → tap **"Add to Home Screen"**
5. Tap **"Add"** in top right
6. ✅ App is now installed on your home screen!

### Requirements:
- iOS 15.4+ (for full PWA support)
- Safari browser (Chrome on iOS doesn't support install)

---

## 🔧 Build Commands

```bash
# Build frontend as PWA
cd frontend
npm run build

# Preview PWA locally
npm run preview

# Deploy to Cloudflare Pages (free)
# Push to GitHub, then connect to Cloudflare Pages
```

---

## 📲 Share Your App

### Share Link (Works on Both Platforms)
```
https://sblms.pages.dev
```

Users can:
- **Android**: Open in Chrome → Add to Home Screen
- **iOS**: Open in Safari → Add to Home Screen

### Share APK (Android Only)
```bash
# Build APK
cd mobile && eas build --platform android --profile preview

# Share the download link from Expo
```

---

## ✅ Features Work Offline

| Feature | Online | Offline |
|---------|--------|---------|
| View cached data | ✅ | ✅ |
| Dashboard | ✅ | ✅ (cached) |
| Create/Edit leads | ✅ | ❌ (syncs when online) |
| Push notifications | ✅ | ✅ |
| Face recognition | ✅ | ❌ |

---

## 🆚 PWA vs Native App

| Feature | PWA (Free) | Native App (Paid) |
|---------|------------|-------------------|
| Install on Android | ✅ Free | ✅ $25 one-time |
| Install on iOS | ✅ Free | ❌ $99/year |
| Push notifications | ✅ | ✅ |
| Offline mode | ✅ Limited | ✅ Full |
| Camera access | ✅ | ✅ |
| Face recognition | ✅ | ✅ |
| App store listing | ❌ | ✅ |

**PWA is 100% free for both platforms!**