module.exports = {
  apps: [
    {
      name: 'araucaria-front',
      script: '.next/standalone/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '0.0.0.0',
      },
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      error_file: './logs/front-error.log',
      out_file: './logs/front-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      watch: false,
    },
  ],
};
