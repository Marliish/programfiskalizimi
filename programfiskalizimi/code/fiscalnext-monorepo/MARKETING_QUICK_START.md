# 🚀 MARKETING & CAMPAIGNS - QUICK START GUIDE

**Team:** Boli (Backend) + Mela (Frontend)  
**Created:** 2026-02-23

---

## ⚡ 5-MINUTE SETUP

### 1. Install Dependencies

```bash
# Install Twilio & SendGrid packages (if not already installed)
cd apps/api
pnpm add twilio @sendgrid/mail
```

### 2. Configure Environment Variables

```bash
# Add to .env or .env.local
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Getting API Keys:**

**SendGrid (Email):**
1. Go to https://sendgrid.com/
2. Sign up / Log in
3. Navigate to Settings → API Keys
4. Create new API key with "Full Access"
5. Copy the key (you'll only see it once!)

**Twilio (SMS):**
1. Go to https://www.twilio.com/
2. Sign up / Log in
3. Go to Console Dashboard
4. Copy Account SID & Auth Token
5. Buy a phone number (or use trial number)

### 3. Run Database Migration

```bash
cd packages/database

# Run migration
npx prisma migrate dev --name add_marketing_features

# Generate Prisma client
npx prisma generate

# (Optional) Seed sample data
npx prisma db seed
```

### 4. Start the API Server

```bash
cd apps/api
pnpm dev
```

### 5. Test the Features

```bash
# Run comprehensive test suite
./test-marketing-complete.sh
```

---

## 📚 FEATURE GUIDES

### ✉️ EMAIL CAMPAIGNS

#### Create a Campaign:

```bash
curl -X POST http://localhost:3001/api/campaigns/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale",
    "subject": "50% OFF Everything!",
    "fromName": "Your Store",
    "fromEmail": "sales@yourstore.com",
    "htmlContent": "<h1>Big Sale!</h1><p>Shop now and save 50%</p>"
  }'
```

#### Send Test Email:

```bash
curl -X POST http://localhost:3001/api/campaigns/email/{CAMPAIGN_ID}/test \
  -H "Content-Type: application/json" \
  -d '{
    "testEmail": "your-email@example.com"
  }'
```

#### Send Campaign:

```bash
curl -X POST http://localhost:3001/api/campaigns/email/{CAMPAIGN_ID}/send
```

#### View Analytics:

```bash
curl http://localhost:3001/api/campaigns/email/{CAMPAIGN_ID}/analytics
```

---

### 📱 SMS CAMPAIGNS

#### Create SMS Campaign:

```bash
curl -X POST http://localhost:3001/api/campaigns/sms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Flash Sale Alert",
    "message": "⚡ FLASH SALE! 40% OFF for 2 hours. Shop now!"
  }'
```

#### Send SMS Campaign:

```bash
curl -X POST http://localhost:3001/api/campaigns/sms/{CAMPAIGN_ID}/send
```

---

### 📋 CUSTOMER SURVEYS

#### Create Survey:

```bash
curl -X POST http://localhost:3001/api/surveys \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Customer Satisfaction Survey",
    "description": "We value your feedback",
    "questions": [
      {
        "question": "How satisfied are you?",
        "questionType": "rating",
        "required": true
      },
      {
        "question": "Any suggestions?",
        "questionType": "text",
        "required": false
      }
    ]
  }'
```

#### Publish Survey:

```bash
curl -X POST http://localhost:3001/api/surveys/{SURVEY_ID}/publish
```

#### View Results:

```bash
curl http://localhost:3001/api/surveys/{SURVEY_ID}/results
```

---

### 🎁 REFERRAL PROGRAM

#### Create Program:

```bash
curl -X POST http://localhost:3001/api/referrals/programs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Refer a Friend",
    "description": "Get $10 for each friend you refer",
    "referrerRewardType": "cash",
    "referrerRewardAmount": 10,
    "refereeRewardType": "discount",
    "refereeRewardAmount": 10,
    "minPurchaseAmount": 50
  }'
```

#### Generate Referral Code:

```bash
curl -X POST http://localhost:3001/api/referrals/generate \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "{PROGRAM_ID}",
    "customerId": "{CUSTOMER_ID}"
  }'
```

#### Track Referral Click:

```bash
curl -X POST http://localhost:3001/api/referrals/track/{REFERRAL_CODE}
```

---

### 📲 SOCIAL MEDIA

#### Create Post:

```bash
curl -X POST http://localhost:3001/api/social/posts \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "facebook",
    "content": "🎉 Big announcement! Check out our new products!",
    "mediaUrls": ["https://example.com/image.jpg"]
  }'
```

#### Schedule Post:

```bash
curl -X POST http://localhost:3001/api/social/posts/{POST_ID}/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledFor": "2026-02-25T14:00:00Z"
  }'
```

#### Publish Post:

```bash
curl -X POST http://localhost:3001/api/social/posts/{POST_ID}/publish
```

---

## 🎯 CUSTOMER SEGMENTATION

### Create Segment:

```bash
curl -X POST http://localhost:3001/api/campaigns/segments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VIP Customers",
    "description": "High-value customers",
    "criteria": {
      "minSpent": 1000
    }
  }'
```

### Segment Criteria Options:

```javascript
{
  "minSpent": 100,           // Minimum total spent
  "maxSpent": 5000,          // Maximum total spent
  "lastPurchaseDays": 30,    // Last purchase within X days
  "tags": ["vip", "premium"] // Customer tags
}
```

### Preview Segment:

```bash
curl -X POST http://localhost:3001/api/campaigns/segments/preview \
  -H "Content-Type: application/json" \
  -d '{
    "criteria": {
      "minSpent": 500,
      "lastPurchaseDays": 90
    }
  }'
```

---

## 🧪 TESTING

### Mock Mode (No API Keys Required)

If you don't have SendGrid/Twilio API keys, the system automatically runs in **mock mode**:
- ✅ All endpoints work normally
- ✅ Mock emails/SMS are logged to console
- ✅ Analytics data is simulated
- ✅ Perfect for development & testing

### Live Mode (Production Ready)

When you add real API keys:
- ✅ Real emails sent via SendGrid
- ✅ Real SMS sent via Twilio
- ✅ Real delivery tracking
- ✅ Real engagement metrics

---

## 📊 MONITORING

### Check Service Status:

```javascript
// In your code:
import { sendGridService } from './services/sendgrid.service';
import { twilioService } from './services/twilio.service';

console.log('SendGrid ready:', sendGridService.isReady());
console.log('Twilio ready:', twilioService.isReady());
```

### View Campaign Stats:

```bash
# Email campaign analytics
curl http://localhost:3001/api/campaigns/email/{CAMPAIGN_ID}/analytics

# Referral program analytics
curl http://localhost:3001/api/referrals/analytics

# Social media overview
curl http://localhost:3001/api/social/overview

# Survey results
curl http://localhost:3001/api/surveys/{SURVEY_ID}/results
```

---

## 🔧 TROUBLESHOOTING

### "Email failed to send"
- ✅ Check SENDGRID_API_KEY is set correctly
- ✅ Verify API key has "Full Access" permissions
- ✅ Check from email is verified in SendGrid
- ✅ View console logs for detailed error

### "SMS failed to send"
- ✅ Check all 3 Twilio env vars are set
- ✅ Verify phone number format (E.164: +1234567890)
- ✅ Check Twilio account has funds
- ✅ Verify phone number is not on blocklist

### "Campaign not sending"
- ✅ Check campaign status (must be 'draft' or 'scheduled')
- ✅ Verify segment has customers
- ✅ Check customers have email/phone numbers
- ✅ View database for recipient records

### Database Issues:
```bash
# Reset database (WARNING: Deletes all data!)
cd packages/database
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate
```

---

## 🎓 NEXT STEPS

### Frontend Development:
1. Build email campaign dashboard (React)
2. Create visual email template editor
3. Build SMS composer with character counter
4. Create survey builder (drag & drop)
5. Build referral dashboard with charts
6. Create social media scheduler (calendar view)

### Advanced Features:
1. A/B testing for campaigns
2. Advanced automation workflows
3. Webhook handlers (SendGrid/Twilio)
4. Email template builder (drag & drop)
5. Social media OAuth integration
6. Advanced analytics & reporting

### Integrations:
1. Facebook Graph API (real posting)
2. Instagram API (real posting)
3. Mailchimp sync
4. Google Analytics integration
5. Zapier integration

---

## 📞 SUPPORT

### Documentation:
- **SendGrid:** https://docs.sendgrid.com/
- **Twilio:** https://www.twilio.com/docs/sms
- **Prisma:** https://www.prisma.io/docs/

### Need Help?
- Check `DAY13_MARKETING_CAMPAIGNS_COMPLETE.md` for full documentation
- Review service files for implementation details
- Test with `./test-marketing-complete.sh`

---

## ✅ CHECKLIST

Before going to production:

- [ ] Add real SendGrid API key
- [ ] Add real Twilio credentials
- [ ] Run database migrations
- [ ] Test email sending
- [ ] Test SMS sending
- [ ] Set up webhook endpoints
- [ ] Configure domain authentication (SendGrid)
- [ ] Add unsubscribe links to emails
- [ ] Test with real customers (small batch)
- [ ] Monitor error logs
- [ ] Set up alerts for failed sends
- [ ] Configure rate limits
- [ ] Add GDPR compliance features
- [ ] Test emergency pause feature

---

**Status:** ✅ READY TO USE  
**Version:** 1.0.0  
**Team:** Boli (Backend) & Mela (Frontend)  

**Happy Marketing! 🚀**
