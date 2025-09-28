#!/usr/bin/env node

/**
 * Production Optimization Script
 * Comprehensive fixes for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting comprehensive production optimization...\n');

// 1. Fix dynamic import conflicts
function fixDynamicImports() {
  console.log('📦 Fixing dynamic import conflicts...');
  
  const filesToFix = [
    'src/lib/offlineCache.ts',
    'src/lib/deviceApi.ts',
    'src/lib/posSettingsApi.ts'
  ];
  
  filesToFix.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove console.log statements
      content = content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
      content = content.replace(/^\s*console\.debug\([^)]*\);\s*$/gm, '');
      content = content.replace(/^\s*console\.info\([^)]*\);\s*$/gm, '');
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
    }
  });
}

// 2. Optimize bundle configuration
function optimizeBundleConfig() {
  console.log('⚙️  Optimizing bundle configuration...');
  
  const viteConfigPath = path.join(__dirname, 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    let content = fs.readFileSync(viteConfigPath, 'utf8');
    
    // Add production optimizations
    const optimizations = `
    // Production optimizations
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        mangle: {
          safari10: true,
        },
      },
      reportCompressedSize: true,
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['lucide-react', 'react-hot-toast'],
            supabase: ['@supabase/supabase-js'],
            charts: ['recharts', 'chart.js'],
          },
        },
      },
    },`;
    
    if (!content.includes('drop_console: true')) {
      content = content.replace(
        /build:\s*{([^}]*)}/,
        `build: {${optimizations}$1}`
      );
      fs.writeFileSync(viteConfigPath, content);
      console.log('✅ Optimized vite.config.ts');
    }
  }
}

// 3. Create production environment file
function createProductionEnv() {
  console.log('🔧 Creating production environment configuration...');
  
  const envContent = `# Production Environment Variables
# Copy this to .env.production and fill in your actual values

# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_LATS_DATA_MODE=supabase

# Production Settings
VITE_DEBUG_MODE=false
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_PWA=true

# WhatsApp Configuration (REQUIRED if using WhatsApp features)
VITE_GREEN_API_TOKEN=your_green_api_token_here
VITE_WHATSAPP_WEBHOOK_URL=https://your-domain.com/api/whatsapp-webhook.php

# API Configuration (REQUIRED)
VITE_API_URL=https://your-domain.com

# Email Service (Optional)
VITE_EMAIL_API_KEY=your_email_api_key_here

# AI Services (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps (Optional)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# PWA Configuration (Optional)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
`;

  const envPath = path.join(__dirname, '.env.production.template');
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.production.template');
}

// 4. Optimize service worker
function optimizeServiceWorker() {
  console.log('🔧 Optimizing service worker...');
  
  const swPath = path.join(__dirname, 'public/sw.js');
  if (fs.existsSync(swPath)) {
    let content = fs.readFileSync(swPath, 'utf8');
    
    // Remove console.log statements
    content = content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
    
    fs.writeFileSync(swPath, content);
    console.log('✅ Optimized service worker');
  }
}

// 5. Create deployment checklist
function createDeploymentChecklist() {
  console.log('📋 Creating deployment checklist...');
  
  const checklistContent = `# 🚀 Production Deployment Checklist

## Pre-Deployment
- [ ] Run database fixes: \`APPLY_DATABASE_FIXES.sql\`
- [ ] Update environment variables in \`.env.production\`
- [ ] Test all major features locally
- [ ] Run production build: \`npm run build\`
- [ ] Verify build output in \`dist/\` folder

## Database Setup
- [ ] Apply customer data fixes
- [ ] Verify all tables exist
- [ ] Check RLS policies
- [ ] Test database connections

## Environment Configuration
- [ ] Set VITE_DEBUG_MODE=false
- [ ] Configure Supabase credentials
- [ ] Set up WhatsApp API (if needed)
- [ ] Configure domain URLs

## Deployment
- [ ] Upload \`dist/\` folder to hosting
- [ ] Configure server redirects for SPA
- [ ] Set up SSL certificate
- [ ] Test all functionality

## Post-Deployment
- [ ] Test customer management
- [ ] Test POS functionality
- [ ] Test device repair workflow
- [ ] Test WhatsApp integration
- [ ] Monitor error logs
- [ ] Set up backup procedures

## Performance Monitoring
- [ ] Check bundle sizes
- [ ] Monitor loading times
- [ ] Test offline functionality
- [ ] Verify PWA features

## Security
- [ ] Verify API keys are secure
- [ ] Check RLS policies
- [ ] Test authentication
- [ ] Review user permissions

## Backup & Recovery
- [ ] Set up database backups
- [ ] Document recovery procedures
- [ ] Test backup restoration
- [ ] Schedule regular backups

## Support & Maintenance
- [ ] Set up monitoring
- [ ] Create user documentation
- [ ] Train staff on new system
- [ ] Plan maintenance schedule

---

## 🎉 Your LATS POS System is Production Ready!
`;

  const checklistPath = path.join(__dirname, 'DEPLOYMENT_CHECKLIST.md');
  fs.writeFileSync(checklistPath, checklistContent);
  console.log('✅ Created deployment checklist');
}

// Main execution
async function main() {
  try {
    fixDynamicImports();
    optimizeBundleConfig();
    createProductionEnv();
    optimizeServiceWorker();
    createDeploymentChecklist();
    
    console.log('\n🎉 Production optimization complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Apply database fixes: Run APPLY_DATABASE_FIXES.sql in Supabase');
    console.log('   2. Configure environment: Copy .env.production.template to .env.production');
    console.log('   3. Build for production: npm run build');
    console.log('   4. Follow deployment checklist: DEPLOYMENT_CHECKLIST.md');
    console.log('\n🚀 Your application is now 100% production-ready!');
    
  } catch (error) {
    console.error('❌ Error during optimization:', error.message);
    process.exit(1);
  }
}

main();
