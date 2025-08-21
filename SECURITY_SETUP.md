# 🔒 DWF Helpdesk Security Setup Guide

## 📋 Overview
This guide helps you set up secure environment variables for the DWF Helpdesk system after addressing GitGuardian security warnings.

## ⚠️ IMPORTANT: Security Notice
- **NEVER** commit `.env` files to version control
- **ALWAYS** use environment variables for sensitive data
- **ROTATE** JWT secrets in production
- **USE** strong passwords for all accounts

## 📁 Environment Files Structure

```
DWFHelpdesk/
├── .env                    # Docker Compose environment
├── backend/.env           # Backend environment
├── frontend/.env          # Frontend environment
└── SECURITY_SETUP.md     # This file
```

## 🔧 Setup Instructions

### 1. Copy Environment Templates

**Root `.env` (for Docker Compose):**
```bash
# Copy from root .env file - already created
cp .env.example .env  # If template exists
```

**Backend `.env`:**
```bash
# Copy from backend .env file - already created
cd backend
cp .env.example .env  # If template exists
```

### 2. Required Environment Variables

Update these variables with your secure values:

```bash
# Database Security
POSTGRES_PASSWORD=your_secure_db_password_here

# JWT Security (use crypto-strong secrets)
JWT_SECRET=your_very_long_jwt_secret_256_bits_minimum
JWT_REFRESH_SECRET=your_very_long_refresh_jwt_secret_256_bits_minimum

# Application Security
ADMIN_PASSWORD=your_secure_admin_password
SUPPORT_PASSWORD=your_secure_support_password
```

### 3. Generate Secure JWT Secrets

Use these commands to generate crypto-strong JWT secrets:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Option 2: Using OpenSSL
openssl rand -base64 64

# Option 3: Using built-in tools
head -c 64 /dev/urandom | base64
```

### 4. Update Postman Collection

The Postman collection now uses variables instead of hardcoded passwords:

**Before (INSECURE):**
```json
"password": "DWF_Admin_2024"
```

**After (SECURE):**
```json  
"password": "{{adminPassword}}"
```

**Set these variables in Postman:**
- `adminPassword`: Your admin password
- `supportPassword`: Your support password
- `newUsername`: Test username for user creation
- `newUserPassword`: Test password for user creation
- `newUserFullName`: Test full name
- `newUserEmail`: Test email

## 🔐 Production Security Checklist

### ✅ Completed (GitGuardian Issues Fixed)
- [x] Removed hardcoded passwords from docker-compose.yml
- [x] Created secure .env files
- [x] Updated Postman collection to use variables
- [x] Verified .gitignore covers all sensitive files
- [x] Generated crypto-strong JWT secrets

### 📋 Additional Production Steps
- [ ] Rotate all passwords and secrets
- [ ] Use external secret management (AWS Secrets Manager, Azure Key Vault)
- [ ] Enable database encryption at rest
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Set up monitoring and alerts
- [ ] Implement backup encryption
- [ ] Test disaster recovery procedures

## 🚨 Security Incident Response

If secrets are accidentally committed:

1. **Immediately rotate affected secrets**
2. **Force push to remove from git history**
3. **Audit access logs**
4. **Update all deployments**
5. **Notify security team**

## 📞 Support

For security-related questions:
- Security Team: security@dwf.go.th
- System Admin: admin@dwf.go.th
- Emergency: Follow organization incident response procedures

---
**Last Updated**: August 21, 2025  
**Security Review**: Required before production deployment