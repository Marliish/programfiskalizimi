#!/bin/bash

# Add /templates route to advanced-reports.ts (alias for /templates/list)
sed -i '' '/fastify.get.*\/templates\/list/i\
  // Get report templates (alias)\
  fastify.get("/templates", async (request: any, reply: any) => {\
    const templates = advancedReportService.getTemplates();\
    return reply.send({ success: true, data: templates });\
  });\
\
' advanced-reports.ts

# Add /templates route to automations.ts
sed -i '' '/export default async function/a\
\
  // Get automation templates\
  fastify.get("/templates", async (request: any, reply: any) => {\
    const templates = [\
      { id: "low-stock-alert", name: "Low Stock Alert", description: "Send email when product stock is low", trigger: "low_stock", action: "email" },\
      { id: "new-customer-welcome", name: "New Customer Welcome", description: "Send welcome email to new customers", trigger: "new_customer", action: "email" },\
      { id: "high-sales-notification", name: "High Sales Alert", description: "Notify when daily sales exceed threshold", trigger: "high_sales", action: "notification" },\
      { id: "auto-reorder", name: "Auto Reorder", description: "Automatically create purchase orders for low stock", trigger: "low_stock", action: "webhook" }\
    ];\
    return reply.send({ success: true, data: templates });\
  });\
' automations.ts

echo "✅ Added missing template routes"
