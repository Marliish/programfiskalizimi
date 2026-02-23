ui = true

storage "file" {
  path = "/vault/file"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

api_addr = "http://0.0.0.0:8200"
cluster_addr = "https://0.0.0.0:8201"

# Development mode settings (CHANGE FOR PRODUCTION)
disable_mlock = true

# Logging
log_level = "Info"
log_format = "json"

# Telemetry
telemetry {
  disable_hostname = false
  prometheus_retention_time = "30s"
}
