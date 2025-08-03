# 🚀 GitHub Backup System

A comprehensive backup solution that automatically backs up your project to GitHub with proper handling of sensitive data and large files.

## ✨ Features

- **Automatic Backup**: One-command backup to GitHub
- **Smart File Filtering**: Excludes sensitive files and large files automatically
- **Version Control**: Full git history and version tracking
- **Easy Restoration**: Restore from any previous backup
- **Status Monitoring**: Check backup status and recent changes
- **Security**: Proper handling of environment variables and sensitive data

## 🛠️ Setup

### Prerequisites

1. **Node.js** (v14 or higher)
   ```bash
   # Check if Node.js is installed
   node --version
   ```

2. **Git** (v2.20 or higher)
   ```bash
   # Check if Git is installed
   git --version
   ```

3. **GitHub Account**
   - Create a free account at [github.com](https://github.com)

### Step 1: Create GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `lats-chance-backup-system`
3. Description: `Complete backup system with local and GitHub integration for business data protection`
4. Make it **PUBLIC**
5. **DO NOT** initialize with README (we already have files)
6. Click "Create repository"

### Step 2: Configure Remote Repository

Run the setup script:
```bash
./setup-github-backup.sh
```

Or manually:
```bash
git remote add origin https://github.com/YOUR_USERNAME/lats-chance-backup-system.git
git branch -M main
```

### Step 3: First Backup

```bash
./backup-github.sh backup "Initial backup"
```

## 📖 Usage

### Basic Commands

```bash
# Backup to GitHub
./backup-github.sh backup

# Backup with custom message
./backup-github.sh backup "Added new features"

# Check backup status
./backup-github.sh status

# Restore from GitHub
./backup-github.sh restore

# Show setup instructions
./backup-github.sh setup
```

### Advanced Usage

```bash
# Direct Node.js usage
node backup-to-github.mjs backup "Custom message"
node backup-to-github.mjs status
node backup-to-github.mjs restore
```

## 🔧 Configuration

### File Exclusions

The system automatically excludes:
- `node_modules/` - Dependencies
- `backups/` - Local backup files
- `database_backups/` - Database dumps
- `.env*` - Environment variables
- `*.key`, `*.pem` - Security keys
- Files larger than 100MB
- Temporary files and logs

### Custom Configuration

Edit `backup-to-github.mjs` to modify:
- Repository settings
- File size limits
- Exclusion patterns
- Include patterns

## 📊 Backup Status

Check your backup status:
```bash
./backup-github.sh status
```

This shows:
- Git repository status
- Remote repository configuration
- Uncommitted changes
- Last commit information

## 🔄 Restoration

### Restore from GitHub

```bash
./backup-github.sh restore
```

This will:
1. Fetch latest changes from GitHub
2. Reset your local files to match GitHub
3. Preserve your git history

### Manual Restoration

```bash
# Fetch latest changes
git fetch origin

# Reset to latest commit
git reset --hard origin/main

# Or restore to specific commit
git reset --hard <commit-hash>
```

## 🛡️ Security Features

### Automatic Protection

- **Environment Variables**: `.env` files are automatically excluded
- **Security Keys**: Certificate and key files are ignored
- **Large Files**: Files over 100MB are skipped
- **Sensitive Data**: Backup files and logs are excluded

### Manual Verification

Check what will be backed up:
```bash
# See git status
git status

# See what files are staged
git diff --cached --name-only
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "Git repository not initialized"
```bash
# Initialize git
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/lats-chance-backup-system.git
```

#### 2. "Authentication failed"
```bash
# Configure git credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Use GitHub CLI or personal access token
gh auth login
```

#### 3. "Large file rejected"
```bash
# Check file size
ls -lh filename

# Add to .gitignore if needed
echo "filename" >> .gitignore
```

#### 4. "Permission denied"
```bash
# Make scripts executable
chmod +x backup-github.sh backup-to-github.mjs
```

### Git Credentials

#### Option 1: GitHub CLI (Recommended)
```bash
# Install GitHub CLI
brew install gh

# Login
gh auth login
```

#### Option 2: Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` permissions
3. Use token as password when prompted

#### Option 3: SSH Keys
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy to GitHub Settings → SSH and GPG keys
```

## 📈 Monitoring

### Backup History

View backup history:
```bash
# See commit history
git log --oneline

# See detailed history
git log --pretty=format:"%h - %an, %ar : %s"
```

### File Changes

Track file changes:
```bash
# See what changed in last commit
git show --name-only

# See changes in specific file
git log --follow filename
```

## 🔄 Automation

### Cron Job (Linux/Mac)

Add to crontab for automatic daily backups:
```bash
# Edit crontab
crontab -e

# Add line for daily backup at 2 AM
0 2 * * * cd /path/to/your/project && ./backup-github.sh backup "Daily backup"
```

### GitHub Actions

Create `.github/workflows/backup.yml`:
```yaml
name: Daily Backup
on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Run Backup
        run: |
          chmod +x backup-github.sh
          ./backup-github.sh backup "Automated backup"
```

## 📋 Best Practices

### Regular Backups
- Run backups after significant changes
- Use descriptive commit messages
- Check status before major changes

### Security
- Never commit sensitive data
- Use environment variables for secrets
- Regularly review excluded files

### Maintenance
- Monitor backup size
- Clean up old branches if needed
- Keep dependencies updated

## 🆘 Support

### Getting Help

1. **Check Status**: `./backup-github.sh status`
2. **View Logs**: Check git log for recent activity
3. **Manual Git**: Use standard git commands for advanced operations

### Useful Commands

```bash
# Check git configuration
git config --list

# View remote repositories
git remote -v

# Check file size
du -sh *

# View gitignore
cat .gitignore
```

## 🎉 Success Indicators

Your backup system is working correctly when:
- ✅ `./backup-github.sh status` shows "No uncommitted changes"
- ✅ GitHub repository has recent commits
- ✅ No sensitive files are in the repository
- ✅ Backup completes without errors

---

**Happy Backing Up! 🚀**

For issues or questions, check the troubleshooting section or create an issue in your GitHub repository. 