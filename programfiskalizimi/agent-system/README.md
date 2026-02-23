# 🤖 FiscalNext Multi-Agent System

**TRUE autonomous agents using Anthropic Claude API**

## What This Is

Real AI agents that:
- Run 24/7 independently
- Use Claude Sonnet 4 to think and decide
- Work in parallel
- Communicate through shared files
- Log all actions
- Auto-restart if they crash

## Agents

1. **CTO (Alex)** - Architecture, code reviews, security (every 2h)
2. **Backend (David)** - API development (every 4h)
3. **Frontend (Elena)** - UI development (every 4h) 
4. **DevOps (Max)** - Infrastructure (every 2h)
5. **Designer (Luna)** - UI/UX (every 6h)
6. **PM (Sara)** - Product management (every 6h)

## Setup

### 1. Get Anthropic API Key

```bash
# Go to: https://console.anthropic.com/
# Create API key
# Copy it
```

### 2. Configure Environment

```bash
cd /Users/admin/.openclaw/workspace/programfiskalizimi/agent-system

# Create .env file
cp .env.example .env

# Edit .env and add your API key
nano .env
```

Add:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 3. Install Dependencies

```bash
# Activate virtual environment
source venv/bin/activate

# Install packages (if not already done)
pip install autogen-agentchat crewai anthropic
```

### 4. Launch All Agents

```bash
# Start the coordinator (launches all agents)
python coordinator.py sk-ant-your-api-key-here

# Or with .env file
python coordinator.py $(grep ANTHROPIC_API_KEY .env | cut -d '=' -f2)
```

## What Happens

1. **Coordinator starts** (`coordinator.py`)
2. **Each agent launches** as separate process
3. **Agents read their instructions** from `/Users/admin/.openclaw/agents/{agent-name}/AGENTS.md`
4. **Agents work on their cycle:**
   - CTO: Every 2 hours (code reviews, architecture)
   - Backend: Every 4 hours (builds API endpoints)
   - Frontend: Every 4 hours (builds UI components)
   - etc.
5. **Agents log everything** to `/programfiskalizimi/reports/agents/{agent}_log.md`
6. **You monitor progress** by reading log files

## Monitor Agents

### Check if agents are running:
```bash
ps aux | grep agent.py
```

### Read agent logs:
```bash
# CTO log
tail -f /Users/admin/.openclaw/workspace/programfiskalizimi/reports/agents/cto_log.md

# Backend log
tail -f /Users/admin/.openclaw/workspace/programfiskalizimi/reports/agents/backend_log.md
```

### Stop all agents:
```bash
# Press Ctrl+C in the coordinator terminal
# Or kill all:
pkill -f agent.py
```

## Cost Estimate

Using Claude Sonnet 4:
- ~$3 per million input tokens
- ~$15 per million output tokens
- Each agent uses ~2000-4000 tokens per cycle

**Estimated daily cost with 6 agents:**
- CTO: 12 cycles/day × 3000 tokens = 36K tokens
- Backend: 6 cycles/day × 4000 tokens = 24K tokens
- Frontend: 6 cycles/day × 4000 tokens = 24K tokens
- DevOps: 12 cycles/day × 2000 tokens = 24K tokens
- Designer: 4 cycles/day × 3000 tokens = 12K tokens
- PM: 4 cycles/day × 3000 tokens = 12K tokens

**Total:** ~132K tokens/day = ~$0.50-2/day = **~$15-60/month**

## Current Status

**Implemented:**
- ✅ Base agent framework
- ✅ CTO agent (full)
- ✅ Backend agent (full)
- ✅ Coordinator system
- ✅ Logging system
- ✅ Auto-restart on crash

**TODO:**
- [ ] Frontend agent implementation
- [ ] DevOps agent implementation
- [ ] Designer agent implementation
- [ ] PM agent implementation
- [ ] Shared state/memory between agents
- [ ] Agent communication protocol

## Next Steps

1. **Test with CTO + Backend agents first**
2. **Monitor logs and costs**
3. **Add remaining agents one by one**
4. **Fine-tune agent prompts based on results**

---

**This is REAL autonomous agents, not scripts or theater!** 🔥
