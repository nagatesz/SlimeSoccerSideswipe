# 🚀 Deployment Guide - GitHub + Vercel

This guide will walk you through deploying your Slime Soccer Sideswipe game to the web using GitHub and Vercel.

## 📋 Prerequisites

- GitHub account (free) - [Sign up here](https://github.com/join)
- Vercel account (free) - [Sign up here](https://vercel.com/signup)
- Git installed on your computer

## 🎯 Step-by-Step Deployment

### Part 1: Push to GitHub

#### 1. Create a New Repository on GitHub

1. Go to [github.com](https://github.com) and log in
2. Click the **+** icon in the top right → **New repository**
3. Fill in the details:
   - Repository name: `slime-soccer-sideswipe` (or any name you like)
   - Description: "A 2D soccer game inspired by Rocket League Sideswipe"
   - Choose **Public** or **Private**
   - **DON'T** check "Initialize with README" (we already have one)
4. Click **Create repository**

#### 2. Initialize Git and Push Your Code

Open terminal/command prompt in your project folder and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit your files
git commit -m "Initial commit - Slime Soccer Sideswipe"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/slime-soccer-sideswipe.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Done!** Your code is now on GitHub. 🎉

---

### Part 2: Deploy to Vercel

#### Method 1: Vercel Dashboard (Recommended for Beginners)

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click **Sign Up** or **Log In**
   - Choose "Continue with GitHub"

2. **Import Your Repository**
   - Click **Add New...** → **Project**
   - You'll see a list of your GitHub repositories
   - Find `slime-soccer-sideswipe` and click **Import**

3. **Configure Project**
   - **Framework Preset**: Vercel will auto-detect Vite ✅
   - **Root Directory**: Leave as `.` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)
   
   Leave everything as default - Vercel handles it automatically!

4. **Deploy**
   - Click **Deploy**
   - Wait 1-2 minutes while Vercel builds your project
   - You'll see "🎉 Congratulations!" when done

5. **Get Your URL**
   - Vercel will give you a URL like: `slime-soccer-sideswipe-xyz123.vercel.app`
   - Click **Visit** to see your live game!

#### Method 2: Vercel CLI (For Advanced Users)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (choose your account)
# - Link to existing project? No
# - Project name? (press enter to use folder name)
# - Directory? (press enter for current)

# Your site is now live! 🚀
```

---

## 🎨 Custom Domain (Optional)

Want a custom domain like `slimesoccer.com`?

1. Buy a domain from [Namecheap](https://www.namecheap.com/), [GoDaddy](https://www.godaddy.com/), etc.
2. In Vercel Dashboard → Your Project → **Settings** → **Domains**
3. Add your domain and follow the instructions

---

## 🔄 Automatic Deployments

**The best part:** Every time you push to GitHub, Vercel automatically redeploys!

```bash
# Make changes to your code
# Then:
git add .
git commit -m "Added new features"
git push

# Vercel will automatically deploy the new version in ~1 minute!
```

---

## ⚙️ Environment Variables (If Needed)

If you add features that need API keys:

1. In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add your variables (e.g., `API_KEY`)
3. Redeploy

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Problem:** Vercel shows "Build Failed"

**Solution:**
1. Check the build logs in Vercel
2. Make sure your code builds locally: `npm run build`
3. Common issues:
   - Missing dependencies → `npm install`
   - Node version mismatch → Add this to `package.json`:
     ```json
     "engines": {
       "node": ">=16.0.0"
     }
     ```

### 404 Error After Deploy

**Problem:** Page shows 404 or blank screen

**Solution:**
- Check Vercel build logs
- Verify `dist` folder is being generated
- Make sure `index.html` is in the root of `dist`

### Stats Don't Persist

**Problem:** Stats reset on page refresh

**Solution:** This is normal for the base version. To persist stats, see the localStorage code in the README.

---

## 📱 Share Your Game!

Once deployed, share your game:

```
🎮 Check out my Slime Soccer Sideswipe game!
👉 https://your-game-url.vercel.app

Built with React and inspired by Rocket League! ⚽
```

---

## 🎉 You're Done!

Your game is now live on the internet! 🌍

- **Live URL**: Your Vercel URL
- **Auto-deploys**: Enabled ✅
- **HTTPS**: Free SSL certificate ✅
- **CDN**: Global fast delivery ✅

Need help? Open an issue on GitHub or check [Vercel's documentation](https://vercel.com/docs).

---

**Happy deploying! 🚀**
