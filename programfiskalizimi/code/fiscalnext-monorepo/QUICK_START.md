# 🚀 FiscalNext - Quick Start Guide

## Start the Application

### 1. Start Backend
```bash
cd apps/api
pnpm dev
```
✅ Backend will run on: **http://localhost:5000**

### 2. Start Frontend
```bash
cd apps/web-admin
pnpm dev
```
✅ Frontend will run on: **http://localhost:3000**

---

## Access the Application

### Main Application
👉 **http://localhost:3000**

- **Login:** `/login`
- **Register:** `/register`
- **Dashboard:** `/dashboard` (requires login)

### Test Pages
- 🧪 **API Test:** http://localhost:3000/test-api.html
- 🏥 **Backend Health:** http://localhost:5000/health
- 📚 **API Docs:** http://localhost:5000 (API overview)

---

## Quick Test Account

**Create a test account:**
1. Go to http://localhost:3000/register
2. Fill in:
   - Business Name: "Test Store"
   - Country: Albania
   - First/Last Name: "John Doe"
   - Email: "test@example.com"
   - Password: "Test1234"
3. Accept terms
4. Submit → Auto-login → Redirects to Dashboard

**Login again:**
1. Go to http://localhost:3000/login
2. Email: "test@example.com"
3. Password: "Test1234"
4. Submit → Redirects to Dashboard

---

## Verify Everything Works

Run the verification script:
```bash
./verify-day1.sh
```

Should show all ✅ green checks!

---

## Day 1 Status: 100% COMPLETE ✅

### ✅ What's Working
- ✅ Backend API (FastAPI + Prisma)
- ✅ Frontend (Next.js + React)
- ✅ Database (PostgreSQL + 16 tables)
- ✅ User Registration
- ✅ User Login
- ✅ JWT Authentication
- ✅ Token Storage
- ✅ Auto-login after registration
- ✅ Dashboard access
- ✅ CORS configured
- ✅ Error handling
- ✅ API client setup

### 📋 API Endpoints Available
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login
- `GET /v1/auth/me` - Get current user
- `GET /health` - Health check

---

## Need Help?

**Check the logs:**
- Backend: Terminal where `cd apps/api && pnpm dev` is running
- Frontend: Terminal where `cd apps/web-admin && pnpm dev` is running

**Common Issues:**
1. **Port already in use:**
   - Backend: Change `PORT` in `apps/api/.env`
   - Frontend: Next.js will auto-assign next port (3001, etc.)

2. **Database connection error:**
   - Check `DATABASE_URL` in `apps/api/.env`
   - Ensure PostgreSQL is running

3. **CORS errors:**
   - Backend CORS is configured for `localhost:3000`
   - If frontend runs on different port, update `apps/api/src/server.ts`

---

## 📖 Documentation

- **Full Day 1 Report:** `DAY1_COMPLETION_REPORT.md`
- **API Docs:** Browse to http://localhost:5000 when backend is running
- **Speed Guide:** `apps/web-admin/SPEED_GUIDE.md`

---

**Last Updated:** 2026-02-23  
**Status:** Production Ready (Day 1 scope)  
**Next:** Day 2 - Protected Routes & Products CRUD
