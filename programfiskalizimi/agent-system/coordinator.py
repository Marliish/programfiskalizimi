#!/usr/bin/env python3
"""
Multi-Agent System Coordinator
Launches and manages all 7 agents
"""

import subprocess
import sys
import time
from pathlib import Path

AGENTS = {
    "teamlead": {"script": "teamlead_agent.py", "enabled": True},
    "cto": {"script": "cto_agent.py", "enabled": True},
    "backend": {"script": "backend_agent.py", "enabled": True},
    "frontend": {"script": "frontend_agent.py", "enabled": True},
    "devops": {"script": "devops_agent.py", "enabled": True},
    "designer": {"script": "designer_agent.py", "enabled": True},
    "pm": {"script": "pm_agent.py", "enabled": True}
}

def launch_agent(agent_id: str, api_key: str):
    """Launch an agent in background"""
    script = AGENTS[agent_id]["script"]
    script_path = Path(__file__).parent / script
    
    if not script_path.exists():
        print(f"⚠️  Agent script not found: {script}")
        return None
    
    print(f"🚀 Launching {agent_id} agent...")
    
    # Launch as background process
    process = subprocess.Popen(
        [sys.executable, str(script_path), api_key],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    print(f"✅ {agent_id} agent launched (PID: {process.pid})")
    return process

def main():
    if len(sys.argv) < 2:
        print("Usage: python coordinator.py <anthropic_api_key>")
        print("\nThis will launch all 7 agents to work 24/7")
        sys.exit(1)
    
    api_key = sys.argv[1]
    
    print("=" * 60)
    print("FiscalNext Multi-Agent System Starting...")
    print("=" * 60)
    print()
    
    processes = {}
    
    # Launch all enabled agents
    for agent_id, config in AGENTS.items():
        if config["enabled"]:
            process = launch_agent(agent_id, api_key)
            if process:
                processes[agent_id] = process
                time.sleep(1)  # Small delay between launches
        else:
            print(f"⏸️  {agent_id} agent disabled")
    
    print()
    print("=" * 60)
    print(f"✅ {len(processes)} agents running!")
    print("=" * 60)
    print()
    print("Agents are now working 24/7 autonomously.")
    print("Check logs in: /Users/admin/.openclaw/workspace/programfiskalizimi/reports/agents/")
    print()
    print("Press Ctrl+C to stop all agents")
    print()
    
    try:
        # Keep coordinator running
        while True:
            time.sleep(60)
            
            # Check if agents are still running
            for agent_id, process in list(processes.items()):
                if process.poll() is not None:
                    print(f"⚠️  {agent_id} agent stopped! Restarting...")
                    processes[agent_id] = launch_agent(agent_id, api_key)
    
    except KeyboardInterrupt:
        print("\n\nStopping all agents...")
        for agent_id, process in processes.items():
            process.terminate()
            print(f"✅ {agent_id} agent stopped")
        print("\nAll agents stopped. Goodbye!")

if __name__ == "__main__":
    main()
