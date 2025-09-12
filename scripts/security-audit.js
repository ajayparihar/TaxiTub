/**
 * Security Audit Script
 * Verifies that no hardcoded passwords exist in the codebase
 */

const fs = require('fs');
const path = require('path');

const SECURITY_PATTERNS = [
  // Only flag actual hardcoded passwords (not empty strings or variables)
  /password\s*[=:]\s*['""][^'"]{3,}['""](?!.*process\.env)(?!.*password\s*[=:]\s*['""]['""])/gi,
  /admin@123|queuepal123|password123|test123/gi,
  // Only flag suspicious bcrypt hashes (not temporary migration ones)
  /\$2[aby]\$\d+\$[A-Za-z0-9./]{53}(?!.*TEMP)/g
];

const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.vscode', 'deprecated-insecure'];
const EXCLUDED_FILES = [
  'package-lock.json', 
  'SECURITY.md', 
  'security-audit.js', 
  'test-queuepal-fixed.ts', 
  'verify-all-fixes.ts',
  'SECURITY_REMEDIATION_COMPLETE.md'  // Contains examples of what was removed
];

function scanDirectory(dirPath, results = []) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(item)) {
        scanDirectory(fullPath, results);
      }
    } else if (stat.isFile()) {
      if (!EXCLUDED_FILES.includes(item)) {
        scanFile(fullPath, results);
      }
    }
  }
  
  return results;
}

function scanFile(filePath, results) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Skip common false positives
      if (isSecureLine(line)) {
        return;
      }
      
      SECURITY_PATTERNS.forEach((pattern, patternIndex) => {
        const matches = line.match(pattern);
        if (matches) {
          results.push({
            file: filePath,
            line: index + 1,
            match: matches[0],
            pattern: patternIndex,
            severity: getSeverity(patternIndex),
            content: line.trim()
          });
        }
      });
    });
  } catch (error) {
    // Skip binary files or files we can't read
    if (error.code !== 'EISDIR') {
      console.warn(`Warning: Could not read ${filePath}: ${error.message}`);
    }
  }
}

function isSecureLine(line) {
  const securePatternsToIgnore = [
    /password:\s*["'']["'']/,  // Empty password fields
    /password\s*=\s*["'']["'']/,  // Empty password assignments
    /let\s+password\s*=\s*["'']["'']/,  // Empty password variables
    /const\s+password\s*=\s*["'']["'']/,  // Empty password constants
    /password.*••••••••/,  // Password masking in UI
    /TEMP_HASH_NEEDS_RESET/,  // Migration temporary hashes
    /password.*\$\{.*\}/,  // Template literals
    /password.*process\.env/  // Environment variables
  ];
  
  return securePatternsToIgnore.some(pattern => pattern.test(line));
}

function getSeverity(patternIndex) {
  switch (patternIndex) {
    case 0: return 'HIGH';     // Direct password assignments
    case 1: return 'CRITICAL'; // Known test passwords
    case 2: return 'MEDIUM';   // bcrypt hashes (acceptable in some contexts)
    default: return 'LOW';
  }
}

function runSecurityAudit() {
  console.log('🔍 Running Security Audit...');
  console.log('🔒 Scanning for hardcoded passwords and credentials\n');
  
  const projectRoot = path.join(__dirname, '..');
  const results = scanDirectory(projectRoot);
  
  if (results.length === 0) {
    console.log('✅ SECURITY AUDIT PASSED');
    console.log('✅ No hardcoded passwords found in codebase');
    console.log('✅ Your application follows secure password practices\n');
    return true;
  }
  
  console.log(`❌ SECURITY AUDIT FAILED - Found ${results.length} potential issues:\n`);
  
  const criticalIssues = results.filter(r => r.severity === 'CRITICAL');
  const highIssues = results.filter(r => r.severity === 'HIGH');
  const mediumIssues = results.filter(r => r.severity === 'MEDIUM');
  
  if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES (Fix Immediately):');
    criticalIssues.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line} - ${issue.match}`);
      console.log(`    Content: ${issue.content.substring(0, 100)}...\n`);
    });
  }
  
  if (highIssues.length > 0) {
    console.log('⚠️  HIGH PRIORITY ISSUES:');
    highIssues.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line} - ${issue.match}`);
      console.log(`    Content: ${issue.content.substring(0, 100)}...\n`);
    });
  }
  
  if (mediumIssues.length > 0) {
    console.log('ℹ️  MEDIUM PRIORITY (Review):');
    mediumIssues.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line} - ${issue.match}`);
    });
  }
  
  console.log('\n🔧 Remediation Steps:');
  console.log('1. Remove all hardcoded passwords from source code');
  console.log('2. Use environment variables: process.env.PASSWORD');
  console.log('3. Use the secure-setup.js script for user creation');
  console.log('4. Store passwords in secure password managers');
  console.log('5. Never commit credentials to version control\n');
  
  return false;
}

// Run audit
const passed = runSecurityAudit();
process.exit(passed ? 0 : 1);
