# 🚀 Delhi-Cabs Deployment Instructions

## Complete Setup Guide for GitHub Pages + Supabase Hosting

---

## Part 1: Supabase Backend Setup

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Sign in with your GitHub account
3. Click **"New Project"**
4. Fill in the details:
   - **Organization**: Select your personal organization
   - **Project Name**: `delhi-cabs-production`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `Asia Southeast (Singapore)` for India)
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be provisioned

### Step 2: Setup Database Schema
1. Once your project is ready, go to the **"SQL Editor"** tab
2. Copy the entire content from `supabase-setup.sql` file
3. Paste it in the SQL Editor
4. Click **"Run"** to execute the script
5. You should see "Database setup completed successfully!" message

### Step 3: Get API Credentials
1. Go to **"Settings"** → **"API"** in the left sidebar
2. Copy these two values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (under "Project API keys")
3. Keep these safe - you'll need them in the next step

---

## Part 2: GitHub Repository Setup

### Step 4: Configure Repository Secrets
1. Go to your GitHub repository: `https://github.com/ajayparihar/Delhi-Cabs`
2. Click **"Settings"** tab
3. In the left sidebar, click **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"** and add these two secrets:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase Project URL (from Step 3)

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY` 
   - Value: Your Supabase anon public key (from Step 3)

### Step 5: Enable GitHub Pages
1. In your repository, go to **"Settings"** tab
2. Scroll down to **"Pages"** in the left sidebar
3. Under **"Source"**, select **"GitHub Actions"**
4. Save the changes

### Step 6: Deploy the Files
1. Commit and push all the new files to your repository:

```bash
git add .
git commit -m "Add deployment configuration for GitHub Pages and Supabase"
git push origin main
```

---

## Part 3: Verification and Testing

### Step 7: Monitor Deployment
1. Go to your repository's **"Actions"** tab
2. You should see a workflow running: **"Deploy TaxiTub to GitHub Pages"**
3. Click on it to monitor the progress
4. Wait for both "build" and "deploy" jobs to complete (usually 2-3 minutes)

### Step 8: Access Your Live Application
1. Once deployment is successful, go to **"Settings"** → **"Pages"**
2. You'll see your site URL: `https://ajayparihar.github.io/Delhi-Cabs/`
3. Click the URL to access your live application
4. Test the key features:
   - Admin dashboard should load
   - Try adding a car
   - Test the queue management
   - Verify passenger booking works

### Step 9: Test Database Connection
1. In your live application, try to:
   - Add a new car (Admin role)
   - Add car to queue (QueuePal role)  
   - Book a taxi (Passenger role)
2. If everything works, your database is properly connected!

---

## Part 4: Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Create .env file with your Supabase credentials
cp .env.example .env
# Edit .env and add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start development server
npm run dev
```

### Making Updates
1. Make your code changes locally
2. Test thoroughly with `npm run dev`
3. Commit and push to GitHub:
```bash
git add .
git commit -m "Your update description"
git push origin main
```
4. GitHub Actions will automatically build and deploy your changes

---

## Part 5: Maintenance and Monitoring

### Regular Tasks
- **Weekly**: Check your Supabase dashboard for database usage
- **Monthly**: Review GitHub Actions usage (free tier has limits)
- **Quarterly**: Update dependencies with `npm update`

### Troubleshooting Common Issues

#### 1. Deployment Failed
- Check the Actions tab for error logs
- Verify your repository secrets are set correctly
- Ensure no syntax errors in your code

#### 2. Application Loads But Features Don't Work
- Check browser console for errors
- Verify Supabase credentials in repository secrets
- Test database connection in Supabase dashboard

#### 3. Database Connection Issues
- Check if your Supabase project is still active
- Verify RLS policies are properly configured
- Test API endpoints in Supabase dashboard

### Getting Help
- Check repository Issues tab
- Review Supabase documentation
- GitHub Pages documentation

---

## 🎉 Congratulations!

Your TaxiTub application is now live at:
**https://ajayparihar.github.io/Delhi-Cabs/**

### What's Included:
- ✅ Frontend hosted on GitHub Pages (FREE)
- ✅ Database and APIs on Supabase (FREE tier)
- ✅ Automatic deployments on code changes
- ✅ SSL certificate (HTTPS)
- ✅ Global CDN distribution

### Next Steps:
1. Share your application URL with users
2. Monitor usage in Supabase dashboard
3. Consider upgrading Supabase plan if you exceed free tier limits
4. Add custom domain if desired

---

**Need Help?** Create an issue in your GitHub repository with detailed error messages and steps to reproduce any problems.
