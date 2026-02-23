# 🚀 Marketing Features - Quick Start Guide

## ⚡ 30-Second Start

```bash
# 1. Start API
cd apps/api && pnpm dev

# 2. Test endpoints
./test-marketing-features.sh

# 3. Open marketing dashboard
# http://localhost:3000/marketing
```

---

## 📋 Feature Quick Reference

### 📧 Email Campaigns
```bash
# List campaigns
curl http://localhost:5000/v1/campaigns/email

# Create campaign
curl -X POST http://localhost:5000/v1/campaigns/email \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "subject": "Hi", "fromName": "FiscalNext", "fromEmail": "test@example.com"}'
```

### 📱 SMS Campaigns
```bash
# List SMS campaigns
curl http://localhost:5000/v1/campaigns/sms

# Create SMS campaign
curl -X POST http://localhost:5000/v1/campaigns/sms \
  -H "Content-Type: application/json" \
  -d '{"name": "Flash Sale", "message": "50% OFF today only!"}'
```

### 📋 Surveys
```bash
# List surveys
curl http://localhost:5000/v1/surveys

# Create survey
curl -X POST http://localhost:5000/v1/surveys \
  -H "Content-Type: application/json" \
  -d '{"title": "Customer Satisfaction", "questions": [{"question": "Rate us", "questionType": "rating"}]}'
```

### 🎁 Referrals
```bash
# Get referral programs
curl http://localhost:5000/v1/referrals/programs

# Create referral program
curl -X POST http://localhost:5000/v1/referrals/programs \
  -H "Content-Type: application/json" \
  -d '{"name": "Spring Referral", "referrerRewardType": "discount", "referrerRewardAmount": 10, "refereeRewardType": "discount", "refereeRewardAmount": 10}'
```

### 📱 Social Media
```bash
# List posts
curl http://localhost:5000/v1/social-media/posts

# Create post
curl -X POST http://localhost:5000/v1/social-media/posts \
  -H "Content-Type: application/json" \
  -d '{"platform": "facebook", "content": "Check out our new products!"}'

# Get reviews
curl http://localhost:5000/v1/social-media/reviews
```

---

## 🎯 What You Can Do

### Email Marketing
- ✅ Create targeted campaigns
- ✅ Segment customers
- ✅ Schedule sends
- ✅ Track opens & clicks
- ✅ A/B testing

### SMS Marketing
- ✅ Send SMS campaigns
- ✅ Track delivery
- ✅ Manage opt-outs
- ✅ Schedule messages

### Customer Surveys
- ✅ Build custom surveys
- ✅ Collect responses
- ✅ Analyze results
- ✅ Calculate NPS

### Referral Programs
- ✅ Create programs
- ✅ Generate codes
- ✅ Track conversions
- ✅ Reward customers

### Social Media
- ✅ Schedule posts
- ✅ Manage reviews
- ✅ Track engagement
- ✅ Respond to feedback

---

## 📊 38 API Endpoints Available

| Feature | Endpoints |
|---------|-----------|
| Email Campaigns | 8 |
| SMS Campaigns | 2 |
| Surveys | 9 |
| Referrals | 9 |
| Social Media | 10 |

---

## 🎨 Frontend Dashboard

Visit: **`/marketing`** to see:
- Overview of all features
- Quick stats
- Recent activity
- Feature navigation

---

## ⚙️ Configuration

### For SendGrid (Email)
```env
SENDGRID_API_KEY=your_key
SENDGRID_FROM_EMAIL=noreply@domain.com
```

### For Twilio (SMS)
```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🧪 Test Everything

```bash
# Run comprehensive test suite
chmod +x test-marketing-features.sh
./test-marketing-features.sh
```

Tests:
- ✅ All CRUD operations
- ✅ Analytics endpoints
- ✅ Business logic
- ✅ Error handling

---

## 📁 File Structure

```
apps/
├── api/src/
│   ├── services/
│   │   ├── campaign.service.ts
│   │   ├── survey.service.ts
│   │   ├── referral.service.ts
│   │   └── social-media.service.ts
│   └── routes/
│       ├── campaigns.ts
│       ├── surveys.ts
│       ├── referrals.ts
│       └── social-media.ts
└── web-admin/app/
    └── marketing/
        └── page.tsx

packages/database/prisma/
└── schema.prisma (14 new models)
```

---

## ✅ Status

| Component | Status |
|-----------|--------|
| Backend Services | ✅ 100% |
| API Endpoints | ✅ 38 endpoints |
| Database Models | ✅ 14 models |
| Frontend Dashboard | ✅ Created |
| Test Coverage | ✅ 25+ tests |

---

## 🚀 Ready to Use!

All features are **fully functional** and ready for:
- Development testing
- Frontend integration
- Demo presentations
- Production deployment

---

**Questions?** Check:
- `DAY13_MARKETING_FEATURES_REPORT.md` - Full documentation
- `MARKETING_COMPLETION_SUMMARY.md` - Executive summary
- `test-marketing-features.sh` - Test all endpoints

**Happy Marketing! 🎉**
