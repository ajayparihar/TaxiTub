# ⚠️ DEPRECATED INSECURE SCRIPTS

**🚨 CRITICAL WARNING: DO NOT USE THESE SCRIPTS**

## Why These Scripts Are Here

These scripts contain **hardcoded passwords** and are **UNSAFE for production use**. They are kept here for reference only and have been moved out of the main scripts directory for security reasons.

## Security Issues

All scripts in this folder contain one or more of the following security vulnerabilities:
- ❌ Hardcoded passwords in source code
- ❌ Plaintext credentials
- ❌ Test passwords like `admin@123`, `queuepal123`
- ❌ No proper password validation

## Safe Alternatives

Instead of using these scripts, use the **secure alternatives**:

### ✅ For Admin Setup:
```bash
node scripts/secure-setup.js --run-secure-setup
```

### ✅ For Environment-Based Passwords:
```bash
export ADMIN_DEFAULT_PASSWORD="your_secure_password"
export CREATE_TEST_QUEUEPAL=true
node scripts/secure-setup.js --run-secure-setup
```

## File List

| File | Issue | Secure Alternative |
|------|-------|-------------------|
| `apply-database-fixes.js` | Hardcoded `admin@123` | `secure-setup.js` |
| `apply-database-fixes.ts` | Hardcoded `admin@123` | `secure-setup.js` |
| `fix-admin-password.js` | Hardcoded `admin@123` | `secure-setup.js` |
| `setup-queuepal.js` | Hardcoded `queuepal123` | `secure-setup.js` |
| `fix-database-schema-simple.sql` | Hardcoded passwords in SQL | Use secure-setup.js instead |

## Security Audit

These files are automatically excluded from security audits. If you need to scan them:

```bash
# This will fail security audit (expected)
grep -r "admin@123\|queuepal123" scripts/deprecated-insecure/
```

## Production Deployment

**NEVER deploy these scripts to production servers.**

For production deployments:
1. Use `scripts/secure-setup.js` only
2. Set strong passwords via environment variables
3. Never commit passwords to version control
4. Use proper secret management systems

---

**Remember: These scripts exist as a cautionary example of what NOT to do with password security.**
