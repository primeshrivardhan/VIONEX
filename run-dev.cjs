const { spawn } = require('child_process');

const child = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });

child.stdout.on('data', data => {
  console.log('STDOUT:', data.toString());
});

child.stderr.on('data', data => {
  console.log('STDERR:', data.toString());
});
