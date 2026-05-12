module.exports = {
  apps: [
    {
      name: "erp-frontend",
      script: "npm",
      args: "start",
      instances: "max",       // Automatically scale to all available CPU cores
      exec_mode: "cluster",   // Run in cluster mode for load balancing
      env: {
        NODE_ENV: "production",
      },
      // Optional, but good practices for Oracle Cloud:
      max_memory_restart: "1G",  // Restart if it exceeds 1GB memory to prevent OOM
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      merge_logs: true
    }
  ]
};
