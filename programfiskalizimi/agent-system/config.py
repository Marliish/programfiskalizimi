# Multi-Agent System Configuration
# True autonomous agents using AutoGen + CrewAI

import os
from dotenv import load_dotenv

load_dotenv()

# API Configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Workspace
WORKSPACE_PATH = "/Users/admin/.openclaw/workspace/programfiskalizimi"
CODE_PATH = f"{WORKSPACE_PATH}/code/fiscalnext-monorepo"
REPORTS_PATH = f"{WORKSPACE_PATH}/reports"

# Agent Configuration
AGENTS = {
    "cto": {
        "name": "Alex (CTO)",
        "model": "claude-sonnet-4",
        "temperature": 0.3,
        "max_tokens": 4000,
        "role": "Chief Technology Officer",
        "responsibilities": [
            "System architecture",
            "Code reviews",
            "Security audits",
            "Performance optimization"
        ],
        "work_cycle_hours": 2
    },
    "backend": {
        "name": "David (Backend)",
        "model": "claude-sonnet-4",
        "temperature": 0.5,
        "max_tokens": 4000,
        "role": "Senior Backend Developer",
        "responsibilities": [
            "API development (Fastify)",
            "Database (Prisma, PostgreSQL)",
            "Authentication & security",
            "Testing"
        ],
        "work_cycle_hours": 4
    },
    "frontend": {
        "name": "Elena (Frontend)",
        "model": "claude-sonnet-4",
        "temperature": 0.5,
        "max_tokens": 4000,
        "role": "Senior Frontend Developer",
        "responsibilities": [
            "React/Next.js development",
            "UI components",
            "Design implementation",
            "Responsive design"
        ],
        "work_cycle_hours": 4
    },
    "devops": {
        "name": "Max (DevOps)",
        "model": "claude-sonnet-4",
        "temperature": 0.3,
        "max_tokens": 3000,
        "role": "DevOps Engineer",
        "responsibilities": [
            "Infrastructure (Docker, K8s)",
            "CI/CD pipelines",
            "Monitoring & alerts",
            "System maintenance"
        ],
        "work_cycle_hours": 2
    },
    "designer": {
        "name": "Luna (Designer)",
        "model": "claude-sonnet-4",
        "temperature": 0.7,
        "max_tokens": 3000,
        "role": "UI/UX Designer",
        "responsibilities": [
            "UI/UX design",
            "Design system",
            "Figma mockups",
            "User experience"
        ],
        "work_cycle_hours": 6
    },
    "pm": {
        "name": "Sara (Product Manager)",
        "model": "claude-sonnet-4",
        "temperature": 0.5,
        "max_tokens": 3000,
        "role": "Product Manager",
        "responsibilities": [
            "Requirements gathering",
            "User stories",
            "Sprint planning",
            "Prioritization"
        ],
        "work_cycle_hours": 6
    }
}

# Working Mode
RUN_MODE = "continuous"  # continuous, scheduled, or manual
CHECK_INTERVAL_MINUTES = 30  # How often agents check for work

# Communication
SHARED_MEMORY_FILE = f"{WORKSPACE_PATH}/agent-system/shared_state.json"
AGENT_LOGS_DIR = f"{REPORTS_PATH}/agents"
