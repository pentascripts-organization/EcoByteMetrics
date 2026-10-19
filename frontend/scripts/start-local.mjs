if (!process.argv.includes('--host')) process.argv.push('--host', '0.0.0.0');
await import('../node_modules/vite/bin/vite.js');
