#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const routesDir = '/Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext-monorepo/apps/api/src/routes';

// Get all .ts files
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

console.log(`Found ${files.length} TypeScript files to process\n`);

let totalFixed = 0;
let filesModified = 0;

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Pattern to match: fastify.METHOD('/path', { schema: { ... }, handler: ... })
  // We need to remove the schema block but keep the handler
  
  // Match the pattern and remove schema blocks
  // This regex finds: schema: { ... }, followed by handler
  const schemaPattern = /(\s+schema:\s*\{[\s\S]*?\},?)(\s+handler:)/g;
  
  let matches = 0;
  content = content.replace(schemaPattern, (match, schemaBlock, handlerPart) => {
    matches++;
    return handlerPart; // Keep only the handler part
  });
  
  if (matches > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ ${file}: Removed ${matches} schema block(s)`);
    totalFixed += matches;
    filesModified++;
  } else {
    console.log(`  ${file}: No schema blocks found`);
  }
});

console.log(`\n═══════════════════════════════════════`);
console.log(`Summary:`);
console.log(`  Files processed: ${files.length}`);
console.log(`  Files modified: ${filesModified}`);
console.log(`  Schema blocks removed: ${totalFixed}`);
console.log(`═══════════════════════════════════════\n`);
