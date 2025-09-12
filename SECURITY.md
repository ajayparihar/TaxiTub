# 🔒 Security Guidelines

## Password Security

**⚠️ CRITICAL: This codebase contains NO hardcoded passwords.**

All authentication credentials must be managed securely:

### 🚨 NEVER Do This:
- ❌ Store passwords in source code
- ❌ Commit passwords to version control
- ❌ Use default/weak passwords in production
- ❌ Share passwords in plain text

### ✅ Secure Practices:

#### For Development:
```bash
# Use the secure setup script
node scripts/secure-setup.js --run-secure-setup
```

#### For Production:
1. **Use Strong Passwords**: Minimum 16 characters with mixed case, numbers, and symbols
2. **Environment Variables**: Store in secure environment variables
3. **Password Rotation**: Change passwords regularly
4. **Access Control**: Limit who has admin access

### 🔧 Setup Process:

1. **Create Admin User:**
   ```bash
   # Option 1: Auto-generate secure password
   node scripts/secure-setup.js --run-secure-setup
   
   # Option 2: Use environment variable
   export ADMIN_DEFAULT_PASSWORD="your_very_secure_password_here"
   node scripts/secure-setup.js --run-secure-setup
   ```

2. **Save Generated Passwords:**
   - The script will display passwords ONCE
   - Save them in a secure password manager
   - Never store them in code or plain text files

3. **For QueuePal Users:**
   ```bash
   export CREATE_TEST_QUEUEPAL=true
   export QUEUEPAL_DEFAULT_PASSWORD="another_secure_password"
   node scripts/secure-setup.js --run-secure-setup
   ```

### 🗂️ File Security Status:

#### ✅ Secure Files:
- `src/services/auth.ts` - No hardcoded credentials
- `scripts/secure-setup.js` - Uses environment variables
- `.env.example` - Contains no real credentials

#### ⚠️ DEPRECATED (Contains Hardcoded Passwords):
- `scripts/fix-admin-password.js` - **DO NOT USE IN PRODUCTION**
- `scripts/setup-queuepal.js` - **DO NOT USE IN PRODUCTION**
- `scripts/apply-database-fixes.js` - **DO NOT USE IN PRODUCTION**
- `scripts/apply-database-fixes.ts` - **DO NOT USE IN PRODUCTION**

### 🔍 Password Verification:

All passwords in the database are:
- ✅ Hashed with bcrypt (12 rounds)
- ✅ Salted automatically
- ✅ Never stored in plain text

### 🚨 Security Incident Response:

If you find hardcoded passwords:
1. **Immediately** change all affected passwords
2. Review git history for exposure
3. Rotate API keys if compromised
4. Update all deployment configurations

### 📞 Security Contacts:

For security issues:
- Create a GitHub issue with "SECURITY" label
- Never include passwords in issue descriptions

---

**Remember: Security is everyone's responsibility. When in doubt, ask!**
