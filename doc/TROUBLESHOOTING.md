# 🔧 TaxiTub Troubleshooting Guide

## ✅ **Recent Issues Fixed**

### **Issue 1: 404 Not Found Error**
**Symptom**: `GET http://localhost:3000/ net::ERR_HTTP_RESPONSE_CODE_FAILURE 404`
**Cause**: `index.html` was in wrong location (public/ instead of root)
**Fix**: ✅ Moved `index.html` to root directory where Vite expects it

### **Issue 2: Invalid Supabase URL Error**
**Symptom**: `Uncaught TypeError: Failed to construct 'URL': Invalid URL`
**Cause**: Environment variables not set, causing invalid URL construction
**Fix**: ✅ Added URL validation and placeholder values in Supabase config

### **Issue 3: Service Worker Registration Error**
**Symptom**: `Failed to register a ServiceWorker...unsupported MIME type`
**Cause**: No service worker file exists but HTML tries to register one
**Fix**: ✅ Disabled service worker registration for development

---

## 🚀 **Current Application Status**

### **✅ Working Features**
- Development server runs on `http://localhost:3000`
- React app loads with proper routing
- All TypeScript compilation works
- Environment variables load correctly
- Supabase client initializes (with placeholder values)

### **⚠️ Expected Warnings**
You may see this warning in the console - **this is normal**:
```
⚠️ TaxiTub: Using placeholder Supabase credentials. Please update your .env file with real values.
```

---

## 🛠️ **Setup Instructions**

### **1. Start Development Server**
```bash
npm run dev
```
Server will start at `http://localhost:3000`

### **2. Set Up Supabase (For Full Functionality)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL from `docs/database-setup.sql`
4. Update `.env` file with your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### **3. Test the Application**
- **Passenger Interface**: `http://localhost:3000/passenger`
- **QueuePal Interface**: `http://localhost:3000/queuepal` 
- **Admin Interface**: `http://localhost:3000/admin`

---

## 🐛 **Common Issues & Solutions**

### **Issue: "Cannot read properties of undefined"**
**Cause**: API calls failing due to missing Supabase setup
**Solution**: Set up real Supabase credentials or check network tab for API errors

### **Issue: "Module not found" errors**
**Cause**: Import paths or missing dependencies  
**Solution**: 
```bash
npm install  # Reinstall dependencies
npm run dev  # Restart server
```

### **Issue: TypeScript errors**
**Cause**: Type mismatches or missing type definitions
**Solution**: Check `tsconfig.json` is present and restart TypeScript service

### **Issue: CSS not loading**
**Cause**: Import paths for CSS files
**Solution**: Ensure `src/index.css` and `src/App.css` exist

### **Issue: Environment variables not loading**
**Cause**: `.env` file not in root or wrong variable names
**Solution**: 
- Ensure `.env` is in project root (same level as `package.json`)
- Use `VITE_` prefix for all variables
- Restart dev server after changing `.env`

---

## 📊 **Development Mode Features**

### **Hot Module Replacement**
- Changes to React components update instantly
- CSS changes apply without page refresh
- TypeScript errors show in browser console

### **Development Tools**
- React DevTools recommended for debugging
- Vite dev server provides detailed error messages
- Source maps enabled for debugging

### **Console Warnings (Normal)**
These warnings are expected in development:
- React DevTools installation prompt
- Supabase placeholder credentials warning
- Vite CJS deprecation notice (doesn't affect functionality)

---

## 🚀 **Production Deployment**

### **Build for Production**
```bash
npm run build
```
Creates optimized build in `dist/` folder

### **Preview Production Build**
```bash
npm run preview
```
Serves production build locally for testing

### **Deploy to GitHub Pages**
1. Build the app: `npm run build`
2. Push `dist/` folder to `gh-pages` branch
3. Enable GitHub Pages in repository settings

---

## 🔍 **Debug Checklist**

When encountering issues, check:

- [ ] Is the dev server running? (`npm run dev`)
- [ ] Are there any TypeScript errors in terminal?
- [ ] Is `index.html` in the root directory?
- [ ] Does `.env` file exist with proper `VITE_` prefixed variables?
- [ ] Are all dependencies installed? (`npm install`)
- [ ] Check browser console for JavaScript errors
- [ ] Check Network tab for failed API requests
- [ ] Verify file paths and imports are correct

---

## 📞 **Getting Help**

If you encounter issues not covered here:

1. **Check the browser console** for error details
2. **Check the terminal** where `npm run dev` is running
3. **Verify file structure** matches the expected layout
4. **Try restarting** the development server
5. **Clear browser cache** and try again

---

**Last Updated**: 2025-09-06  
**Status**: ✅ All major issues resolved  
**Server Status**: 🟢 Running successfully
