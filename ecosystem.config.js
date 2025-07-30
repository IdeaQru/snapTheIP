module.exports = {
  apps: [
    {
      name: 'snaptheip',
      script: 'npx',
      args: 'ts-node websocket-tcp-server.ts',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      log_file: './logs/snaptheip-combined.log',
      out_file: './logs/snaptheip-out.log',
      error_file: './logs/snaptheip-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true
    },
    {
      name: 'buoylisten',
      script: 'npx',
      args: 'ts-node buoylisten.ts',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      log_file: './logs/buoylisten-combined.log',
      out_file: './logs/buoylisten-out.log',
      error_file: './logs/buoylisten-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true
    }
  ]
};
