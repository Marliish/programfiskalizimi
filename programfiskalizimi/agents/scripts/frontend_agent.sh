#!/bin/bash
# Frontend Developer Agent - React/Next.js Development
# Works autonomously, builds UI

AGENT_NAME="Frontend Dev (Elena)"
WORKSPACE="/Users/admin/.openclaw/workspace/programfiskalizimi"
LOG_FILE="$WORKSPACE/reports/agents/frontend_log.md"

mkdir -p "$WORKSPACE/reports/agents"

echo "🎨 Frontend Agent started at $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Task 1: Create login page
echo "## Task: Building Login Page" >> "$LOG_FILE"

ADMIN_DIR="$WORKSPACE/code/fiscalnext-monorepo/apps/web-admin"
if [ -d "$ADMIN_DIR" ]; then
  cd "$ADMIN_DIR"
  mkdir -p app/login
  
  cat > app/login/page.tsx << 'EOFLOGIN'
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:5000/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!res.ok) throw new Error('Login failed');
      
      const data = await res.json();
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Login to FiscalNext</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
EOFLOGIN
  
  echo "✅ Created login page component" >> "$LOG_FILE"
else
  echo "⏳ Waiting for web-admin app to be created..." >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
echo "🎯 Frontend tasks completed at $(date)" >> "$LOG_FILE"
echo "Status: LOGIN PAGE READY" >> "$LOG_FILE"
