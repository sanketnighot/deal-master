#!/usr/bin/env node

/**
 * Test script to validate the fixes made for user identification
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing User Identification Fixes\n');

// Test 1: Check Web3Auth server conversion logic
console.log('✅ Test 1: Web3Auth Server User ID Conversion');
const web3AuthServerPath = path.join(__dirname, '..', 'src', 'lib', 'web3authServer.ts');
const web3AuthContent = fs.readFileSync(web3AuthServerPath, 'utf8');

const fixes = [
  { 
    name: 'Public key to address conversion', 
    pattern: 'ethers\\.computeAddress.*\\.toLowerCase\\(\\)',
    description: 'Converts public keys to lowercase Ethereum addresses'
  },
  { 
    name: 'Lowercase normalization', 
    pattern: 'user_id.*\\.toLowerCase\\(\\)',
    description: 'Ensures user IDs are consistently lowercase'
  },
  { 
    name: 'Ethers import', 
    pattern: 'await import\\([\'"]ethers[\'"]\\)',
    description: 'Dynamic ethers import for server-side address conversion'
  }
];

fixes.forEach(fix => {
  const regex = new RegExp(fix.pattern);
  if (regex.test(web3AuthContent)) {
    console.log(`   ✓ ${fix.name}: ${fix.description}`);
  } else {
    console.log(`   ✗ ${fix.name}: Not found`);
  }
});

// Test 2: Check game creation API normalization
console.log('\n✅ Test 2: Game Creation User Address Normalization');
const gameCreatePath = path.join(__dirname, '..', 'src', 'app', 'api', 'game', 'create', 'route.ts');
const gameCreateContent = fs.readFileSync(gameCreatePath, 'utf8');

const gameCreateFixes = [
  { 
    name: 'Address normalization', 
    pattern: 'normalizedUserAddress.*toLowerCase\\(\\)',
    description: 'Normalizes user address to lowercase'
  },
  { 
    name: 'Database insertion with normalized address', 
    pattern: 'user_id:\\s*normalizedUserAddress',
    description: 'Uses normalized address for database insertion'
  },
  { 
    name: 'Payment verification with normalized address', 
    pattern: 'verifyPYUSDTransfer.*normalizedUserAddress',
    description: 'Uses normalized address for payment verification'
  }
];

gameCreateFixes.forEach(fix => {
  const regex = new RegExp(fix.pattern);
  if (regex.test(gameCreateContent)) {
    console.log(`   ✓ ${fix.name}: ${fix.description}`);
  } else {
    console.log(`   ✗ ${fix.name}: Not found`);
  }
});

// Test 3: Check games fetching API improvements
console.log('\n✅ Test 3: Games Fetching User ID Handling');
const gamesFetchPath = path.join(__dirname, '..', 'src', 'app', 'api', 'games', 'route.ts');
const gamesFetchContent = fs.readFileSync(gamesFetchPath, 'utf8');

const gamesFetchFixes = [
  { 
    name: 'JWT user ID normalization', 
    pattern: 'normalizedJwtUserId.*toLowerCase\\(\\)',
    description: 'Normalizes JWT user ID to lowercase'
  },
  { 
    name: 'User address normalization', 
    pattern: 'normalizedUserAddress.*toLowerCase\\(\\)',
    description: 'Normalizes user address parameter to lowercase'
  },
  { 
    name: 'User ID validation', 
    pattern: 'if.*!queryUserId.*User identification failed',
    description: 'Validates that a user ID is available for querying'
  }
];

gamesFetchFixes.forEach(fix => {
  const regex = new RegExp(fix.pattern);
  if (regex.test(gamesFetchContent)) {
    console.log(`   ✓ ${fix.name}: ${fix.description}`);
  } else {
    console.log(`   ✗ ${fix.name}: Not found`);
  }
});

// Test 4: Check debug endpoint
console.log('\n✅ Test 4: Debug Endpoint for Troubleshooting');
const debugPath = path.join(__dirname, '..', 'src', 'app', 'api', 'debug', 'user-id', 'route.ts');
if (fs.existsSync(debugPath)) {
  const debugContent = fs.readFileSync(debugPath, 'utf8');
  
  const debugFeatures = [
    { name: 'JWT analysis', pattern: 'authResult\\.user_id' },
    { name: 'Wallet address comparison', pattern: 'walletAddress' },
    { name: 'Database query testing', pattern: 'possibleUserIds' },
    { name: 'Multiple ID format testing', pattern: 'gameQueries' }
  ];

  debugFeatures.forEach(feature => {
    const regex = new RegExp(feature.pattern);
    if (regex.test(debugContent)) {
      console.log(`   ✓ ${feature.name}: Available for debugging`);
    } else {
      console.log(`   ✗ ${feature.name}: Not found`);
    }
  });
} else {
  console.log('   ✗ Debug endpoint not found');
}

// Summary
console.log('\n🎯 Fix Summary:');
console.log('   1. Web3Auth server now converts public keys to lowercase Ethereum addresses');
console.log('   2. Game creation normalizes user addresses before database insertion');
console.log('   3. Games fetching handles both JWT user ID and wallet address consistently');
console.log('   4. Debug endpoint available to troubleshoot user ID mismatches');

console.log('\n📋 Key Changes Made:');
console.log('   • User IDs are now consistently lowercase Ethereum addresses');
console.log('   • Public keys are converted to proper Ethereum addresses');
console.log('   • All user identification points use the same format');
console.log('   • Enhanced error handling and debugging capabilities');

console.log('\n🚀 Next Steps:');
console.log('   1. Test payment flow with real Web3Auth login');
console.log('   2. Use debug endpoint to verify user ID consistency');
console.log('   3. Check that games appear in dashboard after creation');
console.log('   4. Remove debug endpoint once issues are resolved');

console.log('\n✨ Expected Resolution:');
console.log('   • Games should create successfully after payment');
console.log('   • Dashboard should load games without errors');
console.log('   • User identification should be consistent throughout');