#!/bin/bash

echo "🔧 Adding Promise<any> return types to Day 9 services..."

for file in src/services/dashboard.service.ts src/services/advanced-report.service.ts src/services/automation.service.ts src/services/forecast.service.ts; do
  echo "Processing $file..."
  
  # Add : Promise<any> after async function declarations that don't have return types
  # This regex finds: async functionName(params) {
  # And replaces with: async functionName(params): Promise<any> {
  
  sed -i '' -E 's/(async [a-zA-Z]+\([^)]*\)) \{/\1: Promise<any> {/g' "$file"
done

echo "✅ Return types added!"
