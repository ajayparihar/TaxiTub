# 🔒 TaxiTub Security Advisories

## Current Status: ⚠️ DEVELOPMENT ONLY

**Important**: The current dependency versions have known security vulnerabilities and should NOT be used in production environments.

## Security Vulnerabilities

### 1. esbuild ≤0.24.2 (Moderate)
- **GHSA**: [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- **Issue**: Development server vulnerability - allows any website to send requests to development server and read responses
- **Impact**: DEVELOPMENT ONLY - Does not affect production builds
- **Current Version**: 0.17.x (via Vite dependency)
- **Fix Available**: Update to esbuild >0.24.2

### 2. Vite 0.11.0 - 6.1.6 (Moderate) 
- **Issue**: Depends on vulnerable version of esbuild
- **Current Version**: 5.4.19
- **Fix Available**: Update to Vite 7.1.4+

## Mitigation Options

### Option 1: Safe Development (Recommended)
**Current Setup** - Safe for development environments:
- ✅ Vulnerabilities only affect development server
- ✅ Production builds are NOT affected
- ✅ No functionality impact
- ✅ Continue development without issues

**Development Best Practices**:
- Only run dev server on localhost
- Don't expose dev server to public networks
- Use production builds for any deployed environments

### Option 2: Update Dependencies (Breaking Changes Possible)
**⚠️ Warning**: This involves a major version upgrade (Vite 5 → 7) and may introduce breaking changes.

```bash
# Backup current state first
npm run build  # Ensure current version works

# Update to latest secure versions
npm install vite@^7.1.4 @vitejs/plugin-react@^4.3.0
npm install esbuild@^0.25.0

# Test thoroughly after update
npm run dev
npm run build
```

**Potential Breaking Changes**:
- API changes in Vite 7.x
- Different build output structure
- Plugin compatibility issues
- Configuration format changes

### Option 3: Production Deployment Strategy
For production deployments:
1. Use `npm run build` to create production bundle
2. Deploy only the `dist/` folder
3. Serve static files with a proper web server (nginx, Apache, etc.)
4. Development dependencies are NOT included in production

## Verification Commands

```bash
# Check current vulnerabilities
npm audit

# Force security audit fix (use with caution)
npm audit fix --force

# Check specific package versions
npm list vite esbuild

# Build production version (safe from dev vulnerabilities)
npm run build
```

## Production Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] Deploy only `dist/` folder contents
- [ ] Use proper production web server
- [ ] Configure HTTPS
- [ ] Set up proper CSP headers
- [ ] Enable gzip/brotli compression
- [ ] Configure caching headers

## Timeline for Updates

- **Immediate**: Document security issues ✅
- **Short Term**: Test Vite 7.x compatibility
- **Medium Term**: Plan migration to Vite 7.x
- **Before Production**: Ensure all dependencies are secure

## Contact

For security concerns regarding this application, please review the development setup and ensure production deployments follow security best practices.

---
**Last Updated**: 2025-09-06  
**Next Review**: Before production deployment  
**Status**: Development dependencies only - production builds are secure
