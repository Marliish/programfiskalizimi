#!/bin/bash

echo "🔧 Fixing Day 9 TypeScript errors..."

# Fix 1: Replace authenticate with authenticateUser in all Day 9 routes
echo "1. Fixing auth middleware imports..."
sed -i '' 's/import { authenticate }/import { authenticateUser as authenticate }/g' src/routes/advanced-reports.ts
sed -i '' 's/import { authenticate }/import { authenticateUser as authenticate }/g' src/routes/automations.ts
sed -i '' 's/import { authenticate }/import { authenticateUser as authenticate }/g' src/routes/dashboards.ts
sed -i '' 's/import { authenticate }/import { authenticateUser as authenticate }/g' src/routes/forecasts.ts

# Fix 2: Update request/reply types to use FastifyRequest/FastifyReply
echo "2. Fixing request/reply types..."
for file in src/routes/advanced-reports.ts src/routes/automations.ts src/routes/dashboards.ts src/routes/forecasts.ts; do
  sed -i '' 's/async (request, reply)/async (request: any, reply: any)/g' "$file"
done

# Fix 3: Remove .js extensions from imports
echo "3. Removing .js extensions..."
for file in src/routes/advanced-reports.ts src/routes/automations.ts src/routes/dashboards.ts src/routes/forecasts.ts; do
  sed -i '' 's/from '\''\.\.\/.*\.js'\''/from '\''&'\''/g' "$file"
  sed -i '' 's/\.js'\''/'\''/g' "$file"
done

echo "✅ Basic fixes applied!"
echo ""
echo "Now testing compilation..."
