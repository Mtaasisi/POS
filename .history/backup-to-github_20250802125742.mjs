#!/usr/bin/env node

/**
 * GitHub Backup Script
 * Automatically backs up your project to GitHub with proper handling of sensitive data
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  repository: {
    name: 'lats-chance-backup-system',
    branch: 'main',
    remote: 'origin'
  },
  backup: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      'backups/**',
      'database_backups/**',
      'Deploy clean/**',
      'extracted_clean_app/**',
      '.history/**',
      '*.log',
      '*.tmp',
      '*.temp',
      'backup.env',
      '.env*',
      '*.key',
      '*.pem',
      '*.p12',
      '*.pfx'
    ],
    includePatterns: [
      'src/**',
      'public/**',
      '*.json',
      '*.js',
      '*.ts',
      '*.tsx',
      '*.html',
      '*.css',
      '*.md',
      '*.sh',
      '*.sql',
      '*.mjs'
    ]
  }
};

/**
 * Check if git is initialized
 */
function isGitInitialized() {
  try {
    execSync('git status', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if remote repository is configured
 */
function hasRemoteRepository() {
  try {
    const remotes = execSync('git remote -v', { encoding: 'utf8' });
    return remotes.includes('origin');
  } catch (error) {
    return false;
  }
}

/**
 * Get current git status
 */
function getGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    return [];
  }
}

/**
 * Check if file should be excluded
 */
function shouldExcludeFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Check exclude patterns
  for (const pattern of config.backup.excludePatterns) {
    if (pattern.includes('**')) {
      const basePattern = pattern.replace('/**', '');
      if (relativePath.startsWith(basePattern)) {
        return true;
      }
    } else if (relativePath.includes(pattern.replace('**', ''))) {
      return true;
    }
  }
  
  // Check file size
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > config.backup.maxFileSize) {
      console.log(`⚠️  Skipping large file: ${relativePath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
      return true;
    }
  } catch (error) {
    // File doesn't exist or can't be accessed
    return true;
  }
  
  return false;
}

/**
 * Get all files to backup
 */
async function getFilesToBackup() {
  const files = [];
  
  async function scanDirectory(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!shouldExcludeFile(fullPath)) {
            await scanDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          if (!shouldExcludeFile(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.log(`⚠️  Cannot access directory: ${dir}`);
    }
  }
  
  await scanDirectory('.');
  return files;
}

/**
 * Create .gitignore file if it doesn't exist
 */
async function createGitignore() {
  const gitignorePath = '.gitignore';
  
  try {
    await fs.access(gitignorePath);
    console.log('✅ .gitignore already exists');
  } catch (error) {
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
backup.env

# Build outputs
dist/
build/
*.tgz
*.tar.gz

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Backup files
backups/
database_backups/
*.backup
*.bak

# Large files
*.zip
*.tar
*.gz
*.rar

# Sensitive files
*.key
*.pem
*.p12
*.pfx
*.crt
*.cert

# Temporary files
*.tmp
*.temp
.tmp/
.temp/

# History files
.history/

# Deploy files
Deploy clean/
extracted_clean_app/

# Database dumps
*.sql.bak
*.dump

# Cache
.cache/
.parcel-cache/
`;
    
    await fs.writeFile(gitignorePath, gitignoreContent);
    console.log('✅ Created .gitignore file');
  }
}

/**
 * Initialize git repository
 */
function initializeGit() {
  if (!isGitInitialized()) {
    console.log('🚀 Initializing git repository...');
    execSync('git init', { stdio: 'inherit' });
    console.log('✅ Git repository initialized');
  } else {
    console.log('✅ Git repository already initialized');
  }
}

/**
 * Add remote repository
 */
function addRemoteRepository() {
  if (!hasRemoteRepository()) {
    console.log('📋 Please add your GitHub repository as remote:');
    console.log('git remote add origin https://github.com/YOUR_USERNAME/lats-chance-backup-system.git');
    console.log('');
    console.log('Or run: ./setup-github-backup.sh');
    return false;
  }
  return true;
}

/**
 * Stage files for commit
 */
function stageFiles(files) {
  console.log('📦 Staging files for commit...');
  
  if (files.length === 0) {
    console.log('ℹ️  No files to stage');
    return false;
  }
  
  try {
    // Add all files
    execSync('git add .', { stdio: 'inherit' });
    console.log(`✅ Staged ${files.length} files`);
    return true;
  } catch (error) {
    console.error('❌ Error staging files:', error.message);
    return false;
  }
}

/**
 * Create commit
 */
function createCommit(message) {
  try {
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
    console.log('✅ Changes committed');
    return true;
  } catch (error) {
    console.error('❌ Error creating commit:', error.message);
    return false;
  }
}

/**
 * Push to GitHub
 */
function pushToGitHub() {
  try {
    console.log('🚀 Pushing to GitHub...');
    execSync(`git push ${config.repository.remote} ${config.repository.branch}`, { stdio: 'inherit' });
    console.log('✅ Successfully pushed to GitHub');
    return true;
  } catch (error) {
    console.error('❌ Error pushing to GitHub:', error.message);
    console.log('');
    console.log('💡 Troubleshooting tips:');
    console.log('1. Make sure you have a GitHub repository set up');
    console.log('2. Check your git credentials');
    console.log('3. Run: git remote -v to verify remote URL');
    console.log('4. Run: ./setup-github-backup.sh to set up GitHub backup');
    return false;
  }
}

/**
 * Create backup summary
 */
function createBackupSummary() {
  const timestamp = new Date().toISOString();
  const summary = {
    timestamp,
    filesBackedUp: 0,
    totalSize: 0,
    commitHash: '',
    branch: config.repository.branch,
    remote: config.repository.remote
  };
  
  try {
    summary.commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.log('⚠️  Could not get commit hash');
  }
  
  return summary;
}

/**
 * Main backup function
 */
async function backupToGitHub(commitMessage = null) {
  console.log('🚀 Starting GitHub backup...');
  console.log('');
  
  // Initialize git if needed
  initializeGit();
  
  // Create .gitignore
  await createGitignore();
  
  // Check remote repository
  if (!addRemoteRepository()) {
    return false;
  }
  
  // Get files to backup
  console.log('📋 Scanning files to backup...');
  const files = await getFilesToBackup();
  console.log(`✅ Found ${files.length} files to backup`);
  
  // Stage files
  if (!stageFiles(files)) {
    return false;
  }
  
  // Create commit
  const message = commitMessage || `Backup: ${new Date().toLocaleString()}`;
  if (!createCommit(message)) {
    return false;
  }
  
  // Push to GitHub
  if (!pushToGitHub()) {
    return false;
  }
  
  // Create summary
  const summary = createBackupSummary();
  summary.filesBackedUp = files.length;
  
  console.log('');
  console.log('🎉 Backup completed successfully!');
  console.log(`📊 Files backed up: ${summary.filesBackedUp}`);
  console.log(`🔗 Commit: ${summary.commitHash}`);
  console.log(`🌐 Branch: ${summary.branch}`);
  console.log(`⏰ Timestamp: ${summary.timestamp}`);
  
  return true;
}

/**
 * Restore from GitHub
 */
function restoreFromGitHub() {
  console.log('🔄 Restoring from GitHub...');
  
  try {
    // Fetch latest changes
    execSync('git fetch origin', { stdio: 'inherit' });
    
    // Reset to latest commit
    execSync('git reset --hard origin/main', { stdio: 'inherit' });
    
    console.log('✅ Successfully restored from GitHub');
    return true;
  } catch (error) {
    console.error('❌ Error restoring from GitHub:', error.message);
    return false;
  }
}

/**
 * Show backup status
 */
function showStatus() {
  console.log('📊 GitHub Backup Status');
  console.log('');
  
  if (!isGitInitialized()) {
    console.log('❌ Git repository not initialized');
    return;
  }
  
  console.log('✅ Git repository initialized');
  
  if (hasRemoteRepository()) {
    console.log('✅ Remote repository configured');
  } else {
    console.log('❌ No remote repository configured');
  }
  
  const status = getGitStatus();
  if (status.length > 0) {
    console.log(`📝 ${status.length} files with changes`);
    status.forEach(file => {
      console.log(`   ${file}`);
    });
  } else {
    console.log('✅ No uncommitted changes');
  }
  
  try {
    const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf8' });
    console.log(`📋 Last commit: ${lastCommit.trim()}`);
  } catch (error) {
    console.log('❌ No commits yet');
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'backup':
  case 'b':
    backupToGitHub(process.argv[3]);
    break;
    
  case 'restore':
  case 'r':
    restoreFromGitHub();
    break;
    
  case 'status':
  case 's':
    showStatus();
    break;
    
  case 'setup':
    console.log('🚀 Setting up GitHub backup...');
    console.log('');
    console.log('📋 Steps:');
    console.log('1. Create a GitHub repository at: https://github.com/new');
    console.log('2. Repository name: lats-chance-backup-system');
    console.log('3. Make it PUBLIC');
    console.log('4. DO NOT initialize with README');
    console.log('5. Run: ./setup-github-backup.sh');
    console.log('');
    console.log('🔗 Quick link: https://github.com/new');
    break;
    
  default:
    console.log('🚀 GitHub Backup System');
    console.log('');
    console.log('Usage:');
    console.log('  node backup-to-github.mjs backup [message]  - Backup to GitHub');
    console.log('  node backup-to-github.mjs restore           - Restore from GitHub');
    console.log('  node backup-to-github.mjs status            - Show backup status');
    console.log('  node backup-to-github.mjs setup             - Setup instructions');
    console.log('');
    console.log('Examples:');
    console.log('  node backup-to-github.mjs backup');
    console.log('  node backup-to-github.mjs backup "Added new features"');
    console.log('  node backup-to-github.mjs status');
    break;
} 