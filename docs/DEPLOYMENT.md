# SBLMS Deployment Guide (All Free)

## Tech Stack

| Layer | Technology | Free Hosting |
|-------|-----------|--------------|
| Frontend | React 18 + TypeScript + Vite | **Cloudflare Pages** (unlimited bandwidth) |
| Backend | .NET 8.0 Web API | **Render.com** (750 hrs/mo, no credit card) |
| Database | PostgreSQL | **Neon** (0.5 GB, 100 compute hrs/mo) |

**Total Cost: $0/month**

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Deploy PostgreSQL (Neon)](#2-deploy-postgresql-neon)
3. [Deploy Backend (Render)](#3-deploy-backend-render)
4. [Deploy Frontend (Cloudflare Pages)](#4-deploy-frontend-cloudflare-pages)
5. [Post-Deployment Configuration](#5-post-deployment-configuration)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Prerequisites

Before deploying, you need:

- [ ] GitHub account (free)
- [ ] Neon account (free - https://neon.com)
- [ ] Render account (free - https://render.com)
- [ ] Cloudflare account (free - https://cloudflare.com)

### Push Code to GitHub

```bash
# From project root
cd /Users/csridaran/Projects/SBLMS

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit - PostgreSQL migration"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/SBLMS.git
git branch -M main
git push -u origin main
```

---

## 2. Deploy PostgreSQL (Neon)

### Step 1: Create Neon Account

1. Go to https://neon.com
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 2: Create Project

1. Click **"Create Project"**
2. Project name: `sblms`
3. Database name: `SBLMS_Dev` (or `SBLMS`)
4. Region: Choose closest to your users (e.g., US East, EU West)
5. Click **"Create Project"**

### Step 3: Get Connection String

1. In the Neon dashboard, go to **Connection Details**
2. Select **.NET / Entity Framework** (this gives Npgsql format)
3. Copy the connection string - it looks like:

```
Host=ep-xxx-xxx.us-east-2.aws.neon.tech;Database=SBLMS_Dev;Username=neondb_owner;Password=xxxxx;SSL Mode=Require;Trust Server Certificate=true
```

4. **Save this string** - you'll need it for Render

### Step 4: Enable SSL (Important!)

Neon requires SSL connections. The connection string includes `SSL Mode=Require`.

---

## 3. Deploy Backend (Render)

### Step 1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub
3. No credit card required for free tier

### Step 2: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the `SBLMS` repository
4. Configure:

| Setting | Value |
|---------|-------|
| Name | `sblms-api` |
| Region | Oregon (or closest) |
| Branch | `main` |
| Runtime | `Docker` |
| Dockerfile Path | `docker/Dockerfile.api` |
| Docker Context | `.` (root) |

5. Click **"Advanced"** and add these **Environment Variables**:

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__DefaultConnection=Host=ep-xxx-xxx.us-east-2.aws.neon.tech;Database=SBLMS_Dev;Username=neondb_owner;Password=xxxxx;SSL Mode=Require;Trust Server Certificate=true
Jwt__Key=YourSuperSecretKeyAtLeast32CharactersLong!!
Jwt__Issuer=SBLMS
Jwt__Audience=SBLMS
Cors__Origins=https://YOUR_FRONTEND_DOMAIN.pages.dev
```

6. Click **"Create Web Service"**

### Step 3: Wait for Build

- First build takes 5-10 minutes
- Render will show build logs
- Once deployed, you'll get a URL like: `https://sblms-api.onrender.com`

### Step 4: Verify Backend

Visit: `https://sblms-api.onrender.com/swagger`

You should see the Swagger UI.

---

## 4. Deploy Frontend (Cloudflare Pages)

### Step 1: Create Cloudflare Account

1. Go to https://cloudflare.com
2. Sign up (free)
3. No credit card required

### Step 2: Create Pages Project

1. In Cloudflare dashboard, go to **"Workers & Pages"**
2. Click **"Create Application"**
3. Click **"Pages"** tab
4. Click **"Connect to Git"**
5. Select your GitHub repository (`SBLMS`)
6. Configure:

| Setting | Value |
|---------|-------|
| Production branch | `main` |
| Framework preset | `Vite` |
| Build command | `cd frontend && npm install && npm run build` |
| Build output directory | `frontend/dist` |

7. Click **"Environment variables"** and add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://sblms-api.onrender.com/api` |

8. Click **"Save and Deploy"**

### Step 3: Wait for Build

- Cloudflare builds in 1-2 minutes
- Once deployed, you'll get a URL like: `https://abc123.sblms.pages.dev`

### Step 4: Verify Frontend

Visit your Cloudflare Pages URL. You should see the SBLMS login page.

---

## 5. Post-Deployment Configuration

### Step 1: Update Backend CORS

Go back to Render → `sblms-api` → Environment → Edit:

Update `Cors__Origins` with your actual Cloudflare Pages URL:

```
Cors__Origins=https://abc123.sblms.pages.dev
```

Click **"Save"** - Render will auto-redeploy.

### Step 2: Update Frontend API URL (if needed)

If your Render URL changed, go to Cloudflare Pages → `sblms` → Settings → Environment variables:

Update `VITE_API_URL` with your actual Render URL:

```
VITE_API_URL=https://sblms-api.onrender.com/api
```

Click **"Save"** and redeploy.

### Step 3: Test Login

1. Open your Cloudflare Pages URL
2. Login with:
   - Email: `sri@sblms.com`
   - Password: `Admin@123`

---

## 6. Troubleshooting

### CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Fix:** Ensure `Cors__Origins` on Render matches your exact Cloudflare Pages URL (including `https://`).

### Database Connection Error

**Error:** `Exception: Couldn't set multipleactiveresultsets`

**Fix:** Neon connection strings should NOT contain `MultipleActiveResultSets=true`. Use the clean string from Neon.

### Cold Start Delays

**Issue:** First request takes 30-60 seconds.

**This is normal for Render free tier.** The service spins down after 15 minutes of inactivity.

**Mitigation:** Upgrade to Render Starter ($7/mo) for always-on.

### Build Failures on Render

**Check:**
1. Dockerfile path is correct: `docker/Dockerfile.api`
2. Docker context is root: `.`
3. All NuGet packages are in `.csproj` files

### Frontend Shows "Cannot Connect to API"

**Check:**
1. `VITE_API_URL` is set correctly in Cloudflare Pages
2. Backend is deployed and running on Render
3. CORS is configured on backend

---

## Quick Reference

| Service | URL | Dashboard |
|---------|-----|-----------|
| Frontend | `https://YOUR.pages.dev` | Cloudflare Dashboard → Workers & Pages |
| Backend | `https://sblms-api.onrender.com` | Render Dashboard → sblms-api |
| Database | `https://console.neon.tech` | Neon Dashboard → sblms project |
| Swagger | `https://sblms-api.onrender.com/swagger` | - |
| Hangfire | `https://sblms-api.onrender.com/hangfire` | - |

---

## Cost Summary

| Service | Free Tier | What You Get |
|---------|-----------|--------------|
| Cloudflare Pages | Unlimited bandwidth | 500 builds/mo, custom domains |
| Render | 750 hrs/mo | 512 MB RAM, 0.1 CPU, sleeps after 15min |
| Neon | 0.5 GB storage | 100 compute hrs/mo, 100 projects |
| **Total** | **$0/month** | Full-stack app + database |

---

## Upgrade Path (When Needed)

| If you need... | Upgrade to | Cost |
|----------------|-----------|------|
| Always-on backend | Render Starter | $7/mo |
| More database storage | Neon Launch | $19/mo |
| Custom domain | Cloudflare (free) | $0 |
| More compute | Neon Scale | $69/mo |
