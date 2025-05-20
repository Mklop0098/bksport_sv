module.exports = {
  apps: [{
    name: 'bksport_sv',
    script: 'dist/server.js',
    watch: '.',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }],

  deploy: {
    production: {
      user: 'root',
      host: '128.199.253.91',
      ref: 'origin/main',
      repo: 'git@github.com:Mklop0098/bksport_sv.git',
      path: '/var/www/bksport_sv',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
