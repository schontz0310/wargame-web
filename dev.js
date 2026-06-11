const { execSync } = require('child_process');

// Remove any --localstorage-file flag that might be causing issues
const originalArgs = process.argv.slice(2);
const cleanArgs = originalArgs.filter(arg => !arg.includes('localstorage-file'));

console.log('Starting Next.js with cleaned args:', cleanArgs.join(' '));

// Start Next.js with cleaned arguments
try {
  execSync(`next dev ${cleanArgs.join(' ')}`, {
    stdio: 'inherit',
    cwd: __dirname
  });
} catch (error) {
  console.error('Error starting Next.js:', error);
  process.exit(1);
}
