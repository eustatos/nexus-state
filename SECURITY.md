# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, email [security@your-domain.com](mailto:security@your-domain.com) with:

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

### Security Audit History

#### February 2026 - Initial Security Audit (QUAL-005)

**Initial State:**

- 26 vulnerabilities found
- 1 critical (basic-ftp path traversal)
- 14 high (minimatch ReDoS, rollup path traversal)
- 9 moderate (svelte XSS, esbuild CSRF, vite bypass)
- 2 low (vite middleware)

**Remediation:**

- Updated vulnerable dependencies (vite, vitepress, svelte, eslint, rollup, esbuild)
- Added pnpm overrides for transitive dependencies
- Forced updates for minimatch, basic-ftp, ajv

**Final State:**

- 0 vulnerabilities
- All dependencies updated to secure versions

## Security Best Practices

### For Contributors

1. **Run `pnpm audit` before submitting PRs**
   - Ensure no new vulnerabilities are introduced
   - If vulnerabilities exist, document them or fix them

2. **Keep dependencies up to date**
   - Review Dependabot PRs promptly
   - Test dependency updates before merging

3. **No secrets in code**
   - Never commit API keys, passwords, or tokens
   - Use environment variables for sensitive data
   - Add `.env` to `.gitignore`

4. **Validate all user inputs**
   - Sanitize data from external sources
   - Use TypeScript strict mode for type safety
   - Implement input validation for public APIs

5. **Follow secure coding practices**
   - Avoid `eval()` and `Function()` constructors
   - Use `textContent` instead of `innerHTML`
   - Implement Content Security Policy (CSP)

### For Users

1. **Keep Nexus State updated**
   - Subscribe to security advisories
   - Update regularly to receive security patches

2. **Review dependency tree**
   - Run `pnpm audit` in your project
   - Monitor transitive dependencies

3. **Report security issues privately**
   - Follow the reporting process above
   - Allow time for a fix before public disclosure

4. **Follow security advisories**
   - Watch the repository for security updates
   - Review GitHub Security tab

## Dependency Management

### Update Process

1. **Check for updates:**

   ```bash
   pnpm outdated
   ```

2. **Update safely:**

   ```bash
   pnpm update <package>
   pnpm run test
   pnpm run build
   ```

3. **Review breaking changes** in the package CHANGELOG

4. **Update lock file:**
   ```bash
   pnpm install
   ```

### Security Overrides

This project uses pnpm overrides to force secure versions of transitive dependencies:

```json
{
  "pnpm": {
    "overrides": {
      "minimatch": "^10.2.3",
      "basic-ftp": "^5.2.0",
      "rollup": "^4.59.0",
      "esbuild": "^0.25.0",
      "vite": "^5.4.21",
      "svelte": "^5.53.5",
      "ajv": "^6.14.0"
    }
  }
}
```

These overrides ensure that even transitive dependencies use secure versions.

## Automated Security

### Dependabot

This project uses GitHub Dependabot for automated dependency updates:

- Weekly checks for updates
- Automatic PRs for security patches
- Grouped updates for dev dependencies

### CI Security Checks

Security checks run on:

- Every push to `main`
- Every pull request
- Weekly scheduled audits

See `.github/workflows/security.yml` for details.

## Security Levels

| Level        | Response Time | Action              |
| ------------ | ------------- | ------------------- |
| **Critical** | Immediate     | Fix within 24 hours |
| **High**     | 7 days        | Fix in next release |
| **Moderate** | 30 days       | Document or fix     |
| **Low**      | Monitor       | Fix when convenient |

## Contact

For security-related questions:

- Email: [security@your-domain.com](mailto:security@your-domain.com)
- GitHub Security Advisories: [Create a private advisory](https://github.com/eustatos/nexus-state/security/advisories)

---

**Last Updated:** 2026-02-27
**Policy Version:** 1.0
