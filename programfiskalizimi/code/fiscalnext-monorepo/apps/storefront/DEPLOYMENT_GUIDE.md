# 🚀 FiscalNext Storefront - Deployment Guide

Complete guide for deploying the e-commerce storefront to production.

## 📋 Pre-Deployment Checklist

### ✅ Backend Requirements
- [ ] FiscalNext API is running and accessible
- [ ] Database is properly configured
- [ ] Products are seeded in the database
- [ ] Payment gateway accounts (Stripe/PayPal) are set up
- [ ] API endpoints are tested and working

### ✅ Frontend Requirements
- [ ] Environment variables are configured
- [ ] Build completes without errors
- [ ] TypeScript compiles successfully
- [ ] All pages load correctly
- [ ] Cart functionality works
- [ ] Checkout flow is tested

### ✅ Payment Configuration
- [ ] Stripe live keys obtained
- [ ] PayPal production credentials obtained
- [ ] Webhook endpoints configured
- [ ] Payment testing completed

### ✅ Security
- [ ] HTTPS is enforced
- [ ] Environment secrets are secured
- [ ] CORS is properly configured
- [ ] Rate limiting is in place

## 🔧 Environment Setup

### Production Environment Variables

Create `.env.production`:

```env
# API
NEXT_PUBLIC_API_URL=https://api.fiscalnext.com

# Stripe (LIVE KEYS)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# PayPal (PRODUCTION)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Site
NEXT_PUBLIC_SITE_URL=https://store.fiscalnext.com
NEXT_PUBLIC_SITE_NAME=FiscalNext Store

# Analytics
NEXT_PUBLIC_GA_ID=G-...
NEXT_PUBLIC_GTM_ID=GTM-...

# Features
NEXT_PUBLIC_ENABLE_WISHLIST=true
NEXT_PUBLIC_ENABLE_REVIEWS=true
NEXT_PUBLIC_ENABLE_LOYALTY=true
```

## 📦 Build & Deploy

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   vercel login
   vercel link
   ```

2. **Configure Project**
   - Framework: Next.js
   - Root directory: `apps/storefront`
   - Build command: `pnpm build`
   - Output directory: `.next`

3. **Set Environment Variables**
   ```bash
   # Via CLI
   vercel env add NEXT_PUBLIC_API_URL production
   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
   # ... add all variables

   # Or via Vercel Dashboard
   # Project Settings → Environment Variables
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:20-alpine AS builder
   
   WORKDIR /app
   RUN npm install -g pnpm
   
   COPY package.json pnpm-lock.yaml ./
   RUN pnpm install --frozen-lockfile
   
   COPY . .
   RUN pnpm build
   
   FROM node:20-alpine AS runner
   WORKDIR /app
   
   ENV NODE_ENV production
   
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   
   EXPOSE 3002
   
   CMD ["node", "server.js"]
   ```

2. **Build Image**
   ```bash
   docker build -t fiscalnext-storefront:latest .
   ```

3. **Run Container**
   ```bash
   docker run -p 3002:3002 \
     -e NEXT_PUBLIC_API_URL=https://api.fiscalnext.com \
     -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... \
     fiscalnext-storefront:latest
   ```

### Option 3: VPS/Server

1. **Install Dependencies**
   ```bash
   # Install Node.js 20+
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install pnpm
   npm install -g pnpm
   
   # Install PM2
   npm install -g pm2
   ```

2. **Clone & Build**
   ```bash
   git clone https://github.com/yourorg/fiscalnext-monorepo.git
   cd fiscalnext-monorepo/apps/storefront
   
   # Install dependencies
   pnpm install --frozen-lockfile
   
   # Build
   pnpm build
   ```

3. **Configure PM2**
   Create `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: 'fiscalnext-storefront',
       script: 'node_modules/next/dist/bin/next',
       args: 'start -p 3002',
       env: {
         NODE_ENV: 'production',
         NEXT_PUBLIC_API_URL: 'https://api.fiscalnext.com',
         // ... other vars
       }
     }]
   };
   ```

4. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**
   ```nginx
   server {
     listen 80;
     server_name store.fiscalnext.com;
     
     location / {
       proxy_pass http://localhost:3002;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

6. **SSL with Let's Encrypt**
   ```bash
   sudo certbot --nginx -d store.fiscalnext.com
   ```

## 🔐 Security Hardening

### 1. Enable HTTPS Only
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ];
  }
};
```

### 2. Environment Secret Management
- Use environment variable managers (Vercel, AWS Secrets Manager, etc.)
- Never commit secrets to git
- Rotate keys regularly

### 3. API Security
- Enable CORS only for your domain
- Implement rate limiting
- Use authentication tokens
- Validate all inputs

## 📊 Monitoring & Analytics

### 1. Error Tracking (Sentry)
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 2. Performance Monitoring
- Google Analytics
- Vercel Analytics
- Custom performance metrics

### 3. Uptime Monitoring
- UptimeRobot
- Pingdom
- Custom health checks

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Storefront

on:
  push:
    branches: [main]
    paths:
      - 'apps/storefront/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: cd apps/storefront && pnpm build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 🧪 Post-Deployment Testing

### Critical Paths to Test
1. ✅ Homepage loads
2. ✅ Product listing works
3. ✅ Product detail page works
4. ✅ Add to cart functions
5. ✅ Checkout flow completes
6. ✅ Payment processing works
7. ✅ Order confirmation received
8. ✅ Customer portal accessible
9. ✅ Order tracking works

### Smoke Test Script
```bash
#!/bin/bash
SITE_URL="https://store.fiscalnext.com"

echo "Testing homepage..."
curl -f $SITE_URL || exit 1

echo "Testing products page..."
curl -f $SITE_URL/products || exit 1

echo "Testing cart page..."
curl -f $SITE_URL/cart || exit 1

echo "All tests passed!"
```

## 🚨 Rollback Plan

### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

### Docker
```bash
# Tag previous working version
docker tag fiscalnext-storefront:latest fiscalnext-storefront:backup

# Rollback
docker stop fiscalnext-storefront
docker run -d --name fiscalnext-storefront fiscalnext-storefront:backup
```

### PM2
```bash
# Restore previous version from git
git reset --hard HEAD~1
pnpm build
pm2 restart fiscalnext-storefront
```

## 📝 Deployment Checklist

- [ ] API is accessible from production environment
- [ ] Environment variables are set
- [ ] Build completes successfully
- [ ] All tests pass
- [ ] SSL certificate is active
- [ ] Domain DNS is configured
- [ ] Monitoring is enabled
- [ ] Backup strategy is in place
- [ ] Team is notified
- [ ] Documentation is updated

## 🆘 Troubleshooting

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules
pnpm install
pnpm build
```

### Runtime Errors
- Check environment variables
- Verify API connectivity
- Check browser console
- Review server logs

### Performance Issues
- Enable Next.js caching
- Optimize images
- Enable CDN
- Review bundle size

## 📞 Support

- **Documentation**: `/apps/storefront/README.md`
- **API Docs**: `https://api.fiscalnext.com/docs`
- **Team Contact**: dev@fiscalnext.com

---

**Deployment completed by**: Boli, Edison & Gesa 🎉
