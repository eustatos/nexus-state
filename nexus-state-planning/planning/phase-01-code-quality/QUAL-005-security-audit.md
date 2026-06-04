# QUAL-005: Security Audit and Fixes

## 📋 Task Overview

**Priority:** 🔴 High  
**Estimated Time:** 2-3 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Perform comprehensive security audit of all dependencies and code, fix vulnerabilities, and establish ongoing security monitoring.

---

## 📦 Security Scope

**Areas to audit:**
- npm dependencies (direct & transitive)
- Package.json security
- Code vulnerabilities (XSS, injection, etc.)
- Configuration files
- Secrets management

---

## 🔍 Current State Analysis

```bash
# Check for known vulnerabilities
npm audit

# Check with production dependencies only
npm audit --production

# Save output
npm audit --json > /tmp/audit-before.json

# Count vulnerabilities
npm audit | grep -E "found \d+ vulnerabilities"
```

---

## ✅ Acceptance Criteria

- [ ] Zero high/critical vulnerabilities
- [ ] Zero moderate vulnerabilities (or documented exceptions)
- [ ] All dependencies up to date (or pinned with reason)
- [ ] Snyk or similar tool integrated
- [ ] Security policy documented
- [ ] Automated security checks in CI

---

## 📝 Implementation Steps

### Step 1: Run Initial Security Audit

```bash
# Full audit
npm audit

# Get detailed JSON report
npm audit --json > audit-report.json

# Check severity levels
npm audit | grep -A 3 "Severity:"

# Production only (more critical)
npm audit --production
```

### Step 2: Fix Auto-fixable Vulnerabilities

```bash
# Auto-fix vulnerabilities
npm audit fix

# Fix including breaking changes (use with caution)
npm audit fix --force

# After fixing, verify tests still pass
npm run test

# Verify build still works
npm run build
```

### Step 3: Manual Vulnerability Review

**For each vulnerability:**

```bash
# Get details
npm audit | grep -A 10 "Package: <vulnerable-package>"

# Research the vulnerability
# - Check CVE database
# - Read security advisory
# - Determine actual impact on project

# Options:
# 1. Update dependency
npm update <package>

# 2. Use override (package.json)
{
  "overrides": {
    "vulnerable-package": "^safe-version"
  }
}

# 3. Document exception (if low risk)
# Create SECURITY.md with justification
```

### Step 4: Update Dependencies Safely

```bash
# Check outdated packages
npm outdated

# Update non-breaking
npm update

# Update major versions (one at a time)
npm install <package>@latest

# Test after each update
npm run test
npm run build
```

### Step 5: Configure Snyk (Recommended)

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate (requires account)
snyk auth

# Test for vulnerabilities
snyk test

# Monitor project
snyk monitor

# Generate report
snyk test --json > snyk-report.json
```

**File:** `.snyk` (Snyk config)

```yaml
# Snyk (https://snyk.io) policy file
version: v1.25.0
ignore: {}
patch: {}
```

### Step 6: Add Security Policy

**File:** `SECURITY.md`

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, email security@your-domain.com with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You should receive a response within 48 hours.

## Known Vulnerabilities

### Accepted Risks

None currently.

### Fixed Vulnerabilities

See [CHANGELOG.md](CHANGELOG.md) for security fixes.

## Security Best Practices

### For Contributors

1. Run `npm audit` before submitting PRs
2. Keep dependencies up to date
3. No secrets in code
4. Validate all user inputs
5. Use TypeScript strict mode

### For Users

1. Keep Nexus State updated
2. Review dependency tree
3. Report security issues privately
4. Follow security advisories
```

### Step 7: Scan for Code Vulnerabilities

**Check for common issues:**

```bash
# 1. No secrets in code
git log -p | grep -E 'password|secret|api.?key' -i

# 2. No eval or dangerous patterns
grep -r "eval(" packages/
grep -r "innerHTML" packages/
grep -r "dangerouslySetInnerHTML" packages/

# 3. Proper input validation
# Manual review of user-facing APIs
```

**Common patterns to avoid:**

```typescript
// ❌ Dangerous: eval
eval(userInput);

// ❌ Dangerous: innerHTML with user data
element.innerHTML = userData;

// ❌ Dangerous: Function constructor
new Function(userInput);

// ✅ Safe: Validated and sanitized
const sanitized = sanitize(userInput);
element.textContent = sanitized;
```

### Step 8: Configure Dependabot

**File:** `.github/dependabot.yml`

```yaml
version: 2
updates:
  # Enable version updates for npm
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "maintainer-username"
    assignees:
      - "maintainer-username"
    labels:
      - "dependencies"
      - "security"
    
    # Group minor updates
    groups:
      dev-dependencies:
        patterns:
          - "@types/*"
          - "eslint*"
          - "prettier"
          - "vitest"
        update-types:
          - "minor"
          - "patch"
    
    # Ignore specific packages (if needed)
    ignore:
      # Ignore major version updates for stable packages
      - dependency-name: "typescript"
        update-types: ["version-update:semver-major"]
```

### Step 9: Add Security Checks to CI

**File:** `.github/workflows/security.yml`

```yaml
name: Security Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    # Run weekly on Monday at 9am UTC
    - cron: '0 9 * * 1'

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: Run Snyk test
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Upload Snyk report
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: snyk-report
          path: snyk-report.json
```

### Step 10: Document Dependency Management

**File:** `docs/guides/dependency-management.md`

```markdown
# Dependency Management

## Updating Dependencies

### Safe Update Process

1. Check for updates:
   \`\`\`bash
   npm outdated
   \`\`\`

2. Update one package at a time:
   \`\`\`bash
   npm update <package>
   npm run test
   npm run build
   \`\`\`

3. Review breaking changes in CHANGELOG

4. Update lock file:
   \`\`\`bash
   npm install
   \`\`\`

## Security

### Audit Process

1. Run security audit:
   \`\`\`bash
   npm audit
   \`\`\`

2. Fix vulnerabilities:
   \`\`\`bash
   npm audit fix
   \`\`\`

3. Manual review for unfixable issues

### Dependency Policies

- ✅ Use exact versions for critical dependencies
- ✅ Use ranges (~, ^) for dev dependencies
- ✅ Document exceptions in SECURITY.md
- ✅ Review all dependency updates in PRs
```

---

## 🧪 Validation Commands

```bash
# 1. Run npm audit
npm audit --audit-level=moderate

# Expected: 0 vulnerabilities (or only low severity with documentation)

# 2. Check with Snyk (if installed)
snyk test

# Expected: No high/critical vulnerabilities

# 3. Verify no secrets in code
git log -p | grep -iE "password|secret|api.?key" || echo "No secrets found"

# 4. Check dependencies are up to date
npm outdated

# 5. Verify tests still pass
npm run test

# 6. Verify build works
npm run build
```

---

## 📚 Context & Background

### Why Security Matters

1. **User Trust:** Security breaches damage reputation
2. **Legal Requirements:** GDPR, data protection laws
3. **Supply Chain:** Dependencies can introduce vulnerabilities
4. **Production Impact:** Vulnerabilities can crash applications
5. **Industry Standard:** Expected from production libraries

### Common npm Security Issues

- **Prototype Pollution:** Modifying Object.prototype
- **Regular Expression DoS:** ReDoS attacks
- **Dependency Confusion:** Malicious package names
- **Outdated Dependencies:** Known CVEs
- **Transitive Dependencies:** Indirect vulnerabilities

### Security Levels

- **Critical:** Immediate fix required
- **High:** Fix within 7 days
- **Moderate:** Fix within 30 days (or document)
- **Low:** Monitor, fix when convenient

---

## 🔗 Related Tasks

- **Depends On:** None (can run independently)
- **Blocks:** Production release
- **Related:** QUAL-001 (strict mode helps prevent bugs)

---

## 📊 Definition of Done

- [ ] Zero critical/high vulnerabilities
- [ ] npm audit passes
- [ ] Snyk integrated (optional but recommended)
- [ ] SECURITY.md created
- [ ] Dependabot configured
- [ ] Security CI workflow added
- [ ] All tests passing
- [ ] Documentation updated

---

## 🚀 Implementation Checklist

```bash
# 1. Initial audit
npm audit > /tmp/audit-before.txt
cat /tmp/audit-before.txt

# 2. Auto-fix vulnerabilities
npm audit fix

# 3. Manual fixes for remaining issues
npm audit
# Review and fix each manually

# 4. Update dependencies
npm outdated
npm update

# 5. Install Snyk (optional)
npm install -g snyk
snyk auth
snyk test

# 6. Create SECURITY.md
# (See Step 6)

# 7. Configure Dependabot
# (See Step 8)

# 8. Add CI security check
# (See Step 9)

# 9. Verify everything works
npm run test
npm run build
npm audit

# 10. Commit
git add SECURITY.md .github/dependabot.yml .github/workflows/security.yml
git commit -m "security: complete security audit and implement monitoring

- Fix all high/critical npm vulnerabilities
- Update dependencies to secure versions
- Add SECURITY.md with vulnerability reporting process
- Configure Dependabot for automated updates
- Add security CI workflow
- Integrate Snyk for continuous monitoring

npm audit: 0 vulnerabilities (was: X)

Resolves: QUAL-005"
```

---

## 📝 Notes for AI Agent

### Handling Vulnerabilities

**Priority Order:**
1. Fix critical immediately
2. Fix high within days
3. Document moderate if can't fix
4. Monitor low severity

**Decision Matrix:**

| Vulnerability | Impact | Fix Available | Action |
|--------------|--------|---------------|---------|
| Critical | Any | Yes | Update immediately |
| Critical | Low | No | Document + workaround |
| High | High | Yes | Update ASAP |
| High | Low | No | Document + monitor |
| Moderate | Any | Yes | Update in next release |
| Moderate | Any | No | Document |
| Low | Any | Any | Monitor |

### Common Fixes

```bash
# Update specific package
npm update <package>

# Update major version
npm install <package>@latest

# Use override (package.json)
{
  "overrides": {
    "vulnerable-dep": "^safe-version"
  }
}

# Use resolutions (for nested deps)
{
  "resolutions": {
    "**/vulnerable-dep": "^safe-version"
  }
}
```

### When Updates Break Things

```bash
# 1. Identify what broke
npm run test -- --reporter=verbose

# 2. Check CHANGELOG of updated package
npm info <package> | grep "description\|version"

# 3. Options:
# a) Fix code to work with new version
# b) Pin to older version temporarily
# c) Find alternative package
```

---

**Created:** 2026-02-23  
**Estimated Completion:** 2026-02-24  
**Actual Completion:** TBD
