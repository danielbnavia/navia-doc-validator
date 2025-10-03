# Netlify Deployment Guide

## Option 1: Deploy via Netlify Web UI (Recommended)

### Step 1: Access Netlify Dashboard
1. Go to https://app.netlify.com
2. Log in with your account

### Step 2: Import GitHub Repository
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Authorize Netlify to access your GitHub account (if not already done)
4. Select repository: **`danielbnavia/navia-doc-validator`**

### Step 3: Configure Build Settings
Netlify should auto-detect these settings from `netlify.toml`, but verify:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`
- **Node version:** 20 (set in netlify.toml)

### Step 4: Add Environment Variables
1. Click **"Add environment variables"** or go to **Site settings → Environment variables**
2. Add the following variable:
   ```
   Key: ANTHROPIC_API_KEY
   Value: sk-ant-... (your actual API key from .env file)
   ```

### Step 5: Deploy
1. Click **"Deploy [site-name]"**
2. Wait for build to complete (~2-3 minutes)
3. Your site will be live at: `https://[random-name].netlify.app`

### Step 6: Custom Domain (Optional)
1. Go to **Site settings → Domain management**
2. Click **"Add custom domain"**
3. Follow instructions to configure DNS

---

## Option 2: Deploy via Netlify CLI

### Prerequisites
```bash
# Login to Netlify (one-time)
npx netlify-cli login
```

### Deploy from GitHub (Automated Builds)
```bash
# Link to existing site or create new one
npx netlify-cli link

# Or create new site from CLI
npx netlify-cli sites:create --name navia-doc-validator

# Set environment variable
npx netlify-cli env:set ANTHROPIC_API_KEY "sk-ant-..."

# Trigger deploy (pushes to GitHub trigger auto-deploy)
git push origin master
```

### Manual Deploy (Skip GitHub)
```bash
# Build locally (requires working node_modules)
npm run build

# Deploy dist folder directly
npx netlify-cli deploy --dir=dist --prod
```

---

## Option 3: Continuous Deployment (Auto-Deploy on Push)

Once connected via GitHub, every push to `master` branch automatically triggers a new deployment.

### Workflow:
1. Make changes locally
2. Commit: `git add . && git commit -m "Your message"`
3. Push: `git push origin master`
4. Netlify automatically builds and deploys

---

## Post-Deployment Checklist

### ✅ Verify Deployment
- [ ] Site is accessible at Netlify URL
- [ ] File upload interface loads correctly
- [ ] Environment variable `ANTHROPIC_API_KEY` is set
- [ ] Test document validation with sample PDF

### ✅ Check Function Logs
1. Go to **Functions** tab in Netlify dashboard
2. Click on **`validate-document`**
3. View real-time logs for debugging

### ✅ Monitor Build Logs
- View build output in **Deploys** tab
- Check for any build warnings or errors
- Verify all dependencies installed correctly

---

## Troubleshooting

### Build Fails on Netlify
**Issue:** `npm install` or `npm run build` fails

**Solution:**
1. Check build logs in Netlify dashboard
2. Verify `package.json` has correct dependencies
3. Ensure `netlify.toml` has correct Node version (20)

### Function Returns 500 Error
**Issue:** Validation fails with server error

**Solution:**
1. Check **Functions** logs in Netlify dashboard
2. Verify `ANTHROPIC_API_KEY` is set correctly
3. Test API key with curl:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
   ```

### CORS Errors
**Issue:** Browser blocks requests to Netlify Function

**Solution:**
- CORS is already configured in `validate-document.ts` (lines 43-48)
- If still seeing errors, check browser console for details
- Verify function URL is `/.netlify/functions/validate-document`

---

## Updating the App

### Update Code
```bash
# Make changes
git add .
git commit -m "Update: description of changes"
git push origin master
```

### Update Environment Variables
```bash
# Via CLI
npx netlify-cli env:set ANTHROPIC_API_KEY "new-value"

# Or via dashboard
# Site settings → Environment variables → Edit
```

### Rollback Deployment
1. Go to **Deploys** tab
2. Find previous working deploy
3. Click **"Publish deploy"**

---

## Current Deployment Status

### Repository
- **GitHub:** https://github.com/danielbnavia/navia-doc-validator
- **Branch:** master

### Netlify Configuration
- **Build command:** `npm run build` (from netlify.toml)
- **Publish directory:** `dist`
- **Functions:** `netlify/functions`
- **Node version:** 20

### Next Steps
1. Go to https://app.netlify.com
2. Import the GitHub repository: `danielbnavia/navia-doc-validator`
3. Add `ANTHROPIC_API_KEY` environment variable
4. Deploy!

---

## Support

For issues:
- Check Netlify build logs
- Review function logs in Netlify dashboard
- Verify environment variables are set correctly
- Test with sample PDF documents from the `/public` folder (if available)
