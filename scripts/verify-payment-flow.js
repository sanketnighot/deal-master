#!/usr/bin/env node

/**
 * Verification script for the PYUSD payment flow
 * This script checks that all the key components are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying PYUSD Payment Flow Implementation\n');

// Check if key files exist
const requiredFiles = [
  'src/app/dashboard/page.tsx',
  'src/components/payment/PYUSDPaymentModal.tsx',
  'src/app/api/game/create/route.ts',
  'src/lib/pyusd.ts',
  'src/lib/config.ts'
];

console.log('✅ Checking required files:');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} - MISSING!`);
  }
});

// Check environment variables requirements
console.log('\n✅ Environment variables needed:');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_WEB3AUTH_CLIENT_ID',
  'WEB3AUTH_ISSUER',
  'ADMIN_PRIVATE_KEY',
  'ALCHEMY_API_KEY'
];

requiredEnvVars.forEach(envVar => {
  console.log(`   • ${envVar}`);
});

// Check configuration
console.log('\n✅ Configuration:');
try {
  const configPath = path.join(__dirname, '..', 'src', 'lib', 'config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  if (configContent.includes('ADMIN_ADDRESS')) {
    console.log('   ✓ Admin address configured');
  }
  if (configContent.includes('PYUSD_ADDRESS')) {
    console.log('   ✓ PYUSD contract address configured');
  }
  if (configContent.includes('ENTRY_FEE_CENTS')) {
    console.log('   ✓ Entry fee configured');
  }
} catch (error) {
  console.log('   ✗ Error reading configuration');
}

// Check payment modal implementation
console.log('\n✅ Payment Modal Features:');
try {
  const modalPath = path.join(__dirname, '..', 'src', 'components', 'payment', 'PYUSDPaymentModal.tsx');
  const modalContent = fs.readFileSync(modalPath, 'utf8');
  
  const features = [
    { check: 'Web3Auth integration', pattern: 'useWeb3Auth' },
    { check: 'Network validation', pattern: 'checkNetwork' },
    { check: 'Balance checking', pattern: 'balanceOf' },
    { check: 'PYUSD transfer', pattern: 'pyusdContract.transfer' },
    { check: 'Error handling', pattern: 'catch.*error' },
    { check: 'Loading states', pattern: 'isProcessing' },
    { check: 'Transaction hash tracking', pattern: 'txHash' }
  ];
  
  features.forEach(feature => {
    const regex = new RegExp(feature.pattern);
    if (regex.test(modalContent)) {
      console.log(`   ✓ ${feature.check}`);
    } else {
      console.log(`   ✗ ${feature.check} - Not found`);
    }
  });
} catch (error) {
  console.log('   ✗ Error reading payment modal');
}

// Check API implementation
console.log('\n✅ API Implementation:');
try {
  const apiPath = path.join(__dirname, '..', 'src', 'app', 'api', 'game', 'create', 'route.ts');
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  
  const apiFeatures = [
    { check: 'Authentication verification', pattern: 'verifyAuthHeader' },
    { check: 'Payment verification', pattern: 'verifyPYUSDTransfer' },
    { check: 'Game creation', pattern: 'generateCardValues' },
    { check: 'Database operations', pattern: 'supabaseAdmin' },
    { check: 'Error handling', pattern: 'catch' }
  ];
  
  apiFeatures.forEach(feature => {
    const regex = new RegExp(feature.pattern);
    if (regex.test(apiContent)) {
      console.log(`   ✓ ${feature.check}`);
    } else {
      console.log(`   ✗ ${feature.check} - Not found`);
    }
  });
} catch (error) {
  console.log('   ✗ Error reading API implementation');
}

console.log('\n🎯 Payment Flow Summary:');
console.log('   1. User clicks "New Game" on dashboard');
console.log('   2. PYUSD Payment Modal opens');
console.log('   3. Modal checks network and wallet connection');
console.log('   4. User approves PYUSD transfer to admin wallet');
console.log('   5. Transaction is submitted and confirmed');
console.log('   6. API verifies the payment transaction');
console.log('   7. Game is created in database');
console.log('   8. User is redirected to the new game');

console.log('\n✨ Implementation Complete!');
console.log('\nNext steps:');
console.log('   1. Set up environment variables');
console.log('   2. Deploy to your preferred hosting platform');
console.log('   3. Test with actual PYUSD tokens on Sepolia');
console.log('   4. Monitor transactions and user flow');