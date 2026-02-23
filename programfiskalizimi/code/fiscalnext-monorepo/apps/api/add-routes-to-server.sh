#!/bin/bash

# Add imports after line 57 (after forecastRoutes)
sed -i '' '57a\
import syncRoutes from '\''./routes/sync.js'\'';\
import batchRoutes from '\''./routes/batch.js'\'';\
import apiMetricsRoutes from '\''./routes/api-metrics.js'\'';\
import integrationRoutes from '\''./routes/integrations.js'\'';
' src/server.ts

# Add route registrations after line 205 (after forecastRoutes)
sed -i '' '205a\
await server.register(syncRoutes, { prefix: '\''/v1/sync'\'' });\
await server.register(batchRoutes, { prefix: '\''/v1/batch'\'' });\
await server.register(apiMetricsRoutes, { prefix: '\''/v1'\'' });\
await server.register(integrationRoutes, { prefix: '\''/v1/integrations'\'' });
' src/server.ts

echo "✅ Routes added to server.ts"
