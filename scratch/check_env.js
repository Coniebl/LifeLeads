const fs = require('fs');
if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf8');
  console.log('Keys in .env.local:', env.split('\n').map(l => l.split('=')[0].trim()).filter(Boolean));
} else {
  console.log('No .env.local');
}
