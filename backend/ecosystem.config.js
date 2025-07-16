module.exports = {
  apps: [{
    name: 'leadenrich-api',
    script: 'dist/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 10000,
    kill_timeout: 5000,
    wait_ready: true,
    node_args: '--max-old-space-size=1024'
  }, {
    name: 'leadenrich-worker',
    script: 'dist/workers/enrichmentWorker.js',
    instances: 2,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/worker-err.log',
    out_file: './logs/worker-out.log',
    autorestart: true,
    max_restarts: 10
  }]
};