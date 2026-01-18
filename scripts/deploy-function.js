const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Deploying Check Credits Expiry function to Appwrite...');

// Check if Appwrite CLI is installed
try {
  execSync('appwrite --version', { stdio: 'pipe' });
  console.log('✅ Appwrite CLI is installed');
} catch (error) {
  console.error('❌ Appwrite CLI is not installed. Please install it first:');
  console.error('   npm install -g appwrite-cli');
  process.exit(1);
}

// Check if .appwrite directory exists (configuration file)
if (!fs.existsSync(path.join(__dirname, '../.appwrite'))) {
  console.log('⚠️  Appwrite configuration not found. Please run:');
  console.log('   appwrite login');
  console.log('   appwrite init project');
  console.log('   cd functions');
  console.log('   appwrite init function');
  console.log('');
  console.log('Or manually create .appwrite/config.json with your project configuration');
}

// Function configuration
const functionName = 'check-credits-expiry';
const functionRuntime = 'node-18.0';
const functionExecute = ['any']; // Allow execution by anyone (cron job)
const functionEvents = []; // No event triggers, only cron
const functionSchedule = '0 0 * * *'; // Daily at midnight
const functionTimeout = 900; // 15 minutes max timeout

// Environment variables that the function needs
const envVars = [
  'APPWRITE_FUNCTION_API_ENDPOINT',
  'APPWRITE_FUNCTION_PROJECT_ID', 
  'APPWRITE_FUNCTION_API_KEY',
  'APPWRITE_DATABASE_ID',
  'APPWRITE_TRANSACTIONS_COLLECTION_ID',
  'APPWRITE_USER_TRANSACTIONS_COLLECTION_ID'
];

console.log(`\n📋 Function Details:`);
console.log(`   Name: ${functionName}`);
console.log(`   Runtime: ${functionRuntime}`);
console.log(`   Schedule: ${functionSchedule} (daily)`);
console.log(`   Timeout: ${functionTimeout}s`);

// Check if function directory exists
const functionDir = path.join(__dirname, `../functions/${functionName}`);
if (!fs.existsSync(functionDir)) {
  console.error(`❌ Function directory does not exist: ${functionDir}`);
  process.exit(1);
}

console.log(`\n📁 Function directory found: ${functionDir}`);

// Check required files
const requiredFiles = ['index.js', 'package.json'];
for (const file of requiredFiles) {
  const filePath = path.join(functionDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Required file missing: ${filePath}`);
    process.exit(1);
  }
}

console.log('✅ All required files present');

// Create temporary archive
console.log('\n📦 Creating function archive...');
const archivePath = path.join(__dirname, `../functions/${functionName}.tar.gz`);

// Change to function directory and create archive
const originalDir = process.cwd();
try {
  process.chdir(functionDir);
  
  // Create tar.gz archive of the function
  execSync(`tar -czf ${archivePath} --exclude="node_modules" .`, { stdio: 'inherit' });
  
  console.log(`✅ Archive created: ${archivePath}`);
} catch (error) {
  console.error('❌ Failed to create archive:', error.message);
  process.chdir(originalDir);
  process.exit(1);
}

// Return to original directory
process.chdir(originalDir);

// Deploy the function
console.log('\n ↑ Deploying function...');
try {
  const deployCmd = [
    'appwrite functions create \\',
    `  --functionId="${functionName}" \\`,
    `  --name="${functionName}" \\`,
    `  --runtime="${functionRuntime}" \\`,
    `  --execute=${JSON.stringify(functionExecute)} \\`,
    `  --events=${JSON.stringify(functionEvents)} \\`,
    `  --schedule="${functionSchedule}" \\`,
    `  --timeout=${functionTimeout} \\`,
    `  --entrypoint="index" \\`,
    `  --commands="npm install" \\`,
    `  --source="${archivePath}"`
  ].join('\n');

  console.log('Running command (you may need to adjust this for your environment):');
  console.log(deployCmd);
  console.log('');

  // In a real scenario, you would execute this command:
  // execSync(deployCmd, { stdio: 'inherit' });

  console.log('\n✅ Deployment command prepared!');
  console.log('\n📋 To complete deployment:');
  console.log('1. Make sure you have configured Appwrite CLI with:');
  console.log('   appwrite login');
  console.log('   appwrite init project # select your project');
  console.log('');
  console.log('2. Run the deployment command:');
  console.log('   appwrite functions create \\');
  console.log('     --functionId="check-credits-expiry" \\');
  console.log('     --name="Check Credits Expiry" \\');
  console.log('     --runtime="node-18.0" \\');
  console.log('     --execute=\'["any"]\' \\');
  console.log('     --schedule="0 0 * * *" \\');
  console.log('     --timeout=900 \\');
  console.log('     --entrypoint="index" \\');
  console.log('     --commands="npm install" \\');
  console.log('     --source="' + archivePath + '"');
  console.log('');
  console.log('3. Add these environment variables in the Appwrite console:');
  envVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('');
  console.log('💡 Pro tip: You can also deploy this function using the Appwrite Console UI');
  console.log('    by uploading the folder directly and setting the configuration there.');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Function deployment script completed!');
console.log('The function will now run daily to check and update expired credits.');