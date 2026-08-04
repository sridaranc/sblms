# Free Hosting Guide for Web & Mobile Apps

## Table of Contents
1. [Web App Hosting](#web-app-hosting)
2. [Mobile App Deployment](#mobile-app-deployment)
3. [Backend/API Hosting](#backendapi-hosting)

---

## Web App Hosting

### 1. Vercel (Recommended for Next.js/React)

**Step-by-Step:**

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub account
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"
   - Your app is live at `https://your-project.vercel.app`

**Free Tier Limits:**
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS

---

### 2. Netlify (Great for Static Sites & JAMstack)

**Step-by-Step:**

1. **Build your project locally**
   ```bash
   npm run build
   ```

2. **Deploy on Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub
   - Click "Add new site" → "Import an existing project"
   - Select your repository
   - Set build command: `npm run build`
   - Set publish directory: `dist` or `build`
   - Click "Deploy site"

**Free Tier Limits:**
- 100GB bandwidth/month
- 300 build minutes/month

---

### 3. GitHub Pages (Static Sites Only)

**Step-by-Step:**

1. **Create a `docs` folder or use `gh-pages` branch**

2. **Enable GitHub Pages**
   - Go to your repo → Settings → Pages
   - Select source branch (main or gh-pages)
   - Your site is live at `https://yourusername.github.io/repo-name`

**With GitHub Actions (for React/Vue):**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

---

### 4. Cloudflare Pages

**Step-by-Step:**

1. **Connect your GitHub repo**
   - Go to [pages.cloudflare.com](https://pages.cloudflare.com)
   - Click "Create a project"
   - Connect to Git
   - Select your repository

2. **Configure build settings**
   - Build command: `npm run build`
   - Build output directory: `dist` or `build`

3. **Deploy**
   - Click "Save and Deploy"
   - Live at `https://your-project.pages.dev`

**Free Tier:** Unlimited bandwidth

---

## Mobile App Deployment

### 1. Expo (React Native) - EAS Build

**Step-by-Step:**

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Initialize EAS**
   ```bash
   eas build:configure
   ```

4. **Build for Android**
   ```bash
   eas build --platform android --profile preview
   ```

5. **Build for iOS**
   ```bash
   eas build --platform ios --profile preview
   ```

6. **Submit to stores**
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

---

### 2. Firebase App Distribution

**Step-by-Step:**

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase**
   ```bash
   firebase init
   ```

3. **Build your app**
   ```bash
   # Android
   cd android && ./gradlew assembleRelease
   
   # iOS - use Xcode or fastlane
   ```

4. **Upload to Firebase**
   ```bash
   firebase appdistribution:distribute app.apk \
     --app 1:1234567890:android:abcdef123456
   ```

5. **Share with testers**
   - Go to Firebase Console → App Distribution
   - Add tester emails or groups

---

### 3. Appetize.io (Demo/App Preview)

**Step-by-Step:**

1. Build your APK/IPA
2. Upload to [appetize.io](https://appetize.io)
3. Get a shareable link for demos

---

## Backend/API Hosting

### 1. Railway

**Step-by-Step:**

1. **Connect GitHub repo**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub"

2. **Configure**
   - Select your backend repo
   - Railway auto-detects the framework

3. **Add environment variables**
   - Go to Variables tab
   - Add your `.env` variables

4. **Deploy**
   - Click "Deploy"
   - Get your API URL

**Free Tier:** $5 credit/month

---

### 2. Render

**Step-by-Step:**

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - Name: your-service
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Click "Create Web Service"

**Free Tier:** 750 hours/month

---

### 3. Supabase (Database + Auth + API)

**Step-by-Step:**

1. Go to [supabase.com](https://supabase.com)
2. Sign up and create new project
3. Get your API keys from Settings → API
4. Use the client library:
   ```javascript
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(
     'https://your-project.supabase.co',
     'your-anon-key'
   )
   ```

**Free Tier:** 500MB database, 1GB file storage

---

### 4. PlanetScale (MySQL Database)

**Step-by-Step:**

1. Go to [planetscale.com](https://planetscale.com)
2. Create account and new database
3. Get connection string
4. Connect from your app:
   ```bash
   mysql -h your-host -u your-user -p your-db
   ```

**Free Tier:** 1 database, 1GB storage

---

## Complete Deployment Checklist

### Frontend (React/Vue/Next.js)
- [ ] Push code to GitHub
- [ ] Choose hosting platform (Vercel/Netlify/Cloudflare)
- [ ] Connect repository
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Deploy
- [ ] Set up custom domain (optional)

### Backend (Node.js/Express/Django)
- [ ] Push code to GitHub
- [ ] Choose platform (Railway/Render/Fly.io)
- [ ] Connect repository
- [ ] Configure environment variables
- [ ] Set up database connection
- [ ] Deploy
- [ ] Test API endpoints

### Mobile App (React Native/Flutter)
- [ ] Build APK/IPA
- [ ] Choose distribution (EAS/Firebase/Appetize)
- [ ] Upload build
- [ ] Add testers
- [ ] Test on devices
- [ ] Submit to stores (optional)

---

## Quick Start Commands

```bash
# Create new React app
npx create-react-app my-app
cd my-app
npm start

# Create new Next.js app
npx create-next-app@latest my-app
cd my-app
npm run dev

# Create new React Native app
npx react-native init MyApp
# or with Expo
npx create-expo-app MyApp

# Build for production
npm run build

# Deploy to Vercel
npx vercel

# Deploy to Netlify
npx netlify deploy --prod
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check Node version, run `npm install` |
| 404 errors | Verify build output directory |
| API not connecting | Check environment variables |
| Mobile build fails | Ensure native dependencies are linked |
| Domain not working | Update DNS records, wait 24-48 hours |

---

## Useful Resources

- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Expo Docs](https://docs.expo.dev)
- [Firebase Docs](https://firebase.google.com/docs)
