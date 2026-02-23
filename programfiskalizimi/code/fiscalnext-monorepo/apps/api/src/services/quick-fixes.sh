#!/bin/bash

# Fix implicit any parameters
sed -i '' 's/(widget)/(widget: any)/g' dashboard.service.ts
sed -i '' 's/((sum, item)/((sum: any, item: any)/g' forecast.service.ts

# Fix JsonValue type issues - cast to any
sed -i '' 's/config: widget.config/config: widget.config as any/g' dashboard.service.ts
sed -i '' 's/widgets: widgetData/widgets: widgetData as any/g' dashboard.service.ts

echo "✅ Final fixes applied!"
