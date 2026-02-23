#!/usr/bin/env python3
"""
Base Agent Class for FiscalNext Multi-Agent System
Each agent inherits from this and runs autonomously
"""

import json
import os
import time
from datetime import datetime
from pathlib import Path
from anthropic import Anthropic
from config import AGENTS, WORKSPACE_PATH, AGENT_LOGS_DIR

class BaseAgent:
    def __init__(self, agent_id: str, api_key: str):
        self.agent_id = agent_id
        self.config = AGENTS[agent_id]
        self.name = self.config["name"]
        self.role = self.config["role"]
        self.client = Anthropic(api_key=api_key)
        self.workspace = WORKSPACE_PATH
        self.log_file = f"{AGENT_LOGS_DIR}/{agent_id}_log.md"
        
        # Ensure log directory exists
        Path(AGENT_LOGS_DIR).mkdir(parents=True, exist_ok=True)
        
    def log(self, message: str, level: str = "INFO"):
        """Log message to agent's log file"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] [{level}] {message}\n"
        
        with open(self.log_file, "a") as f:
            f.write(log_entry)
        
        print(f"[{self.name}] {message}")
    
    def read_instructions(self):
        """Read agent's AGENTS.md instructions"""
        agent_dir = f"/Users/admin/.openclaw/agents/{self.agent_id.replace('_', '-')}"
        instructions_file = f"{agent_dir}/AGENTS.md"
        
        if os.path.exists(instructions_file):
            with open(instructions_file, "r") as f:
                return f.read()
        return None
    
    def get_context(self):
        """Get current project context"""
        context = {
            "role": self.role,
            "responsibilities": self.config["responsibilities"],
            "workspace": self.workspace,
            "current_time": datetime.now().isoformat()
        }
        return context
    
    def think(self, prompt: str):
        """Use Claude to think and decide what to do"""
        instructions = self.read_instructions()
        context = self.get_context()
        
        system_prompt = f"""You are {self.name}, {self.role} for FiscalNext.

Your responsibilities: {', '.join(self.config['responsibilities'])}

Current context:
- Workspace: {self.workspace}
- Time: {context['current_time']}

Your instructions from AGENTS.md:
{instructions}

You work autonomously. Based on your instructions and current state, decide what to do next.
"""
        
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=self.config["max_tokens"],
            temperature=self.config["temperature"],
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.content[0].text
    
    def execute_action(self, action: str):
        """Execute a specific action (overridden by subclasses)"""
        raise NotImplementedError("Subclass must implement execute_action")
    
    def work_cycle(self):
        """Main work cycle - run autonomously"""
        self.log(f"Starting work cycle")
        
        # Think about what to do
        prompt = """
Based on your role and current tasks:
1. Check what needs to be done
2. Decide on the next action
3. Describe what you'll do

Respond in JSON format:
{
  "action": "description of action",
  "priority": "high|medium|low",
  "estimated_time": "minutes"
}
"""
        
        decision = self.think(prompt)
        self.log(f"Decision: {decision}")
        
        # Execute the action
        try:
            self.execute_action(decision)
            self.log(f"✅ Work cycle completed")
        except Exception as e:
            self.log(f"❌ Error: {str(e)}", "ERROR")
    
    def run(self):
        """Run agent continuously"""
        self.log(f"🚀 Agent started - running every {self.config['work_cycle_hours']} hours")
        
        while True:
            try:
                self.work_cycle()
            except Exception as e:
                self.log(f"Critical error: {str(e)}", "ERROR")
            
            # Sleep until next cycle
            sleep_seconds = self.config["work_cycle_hours"] * 3600
            self.log(f"💤 Sleeping for {self.config['work_cycle_hours']} hours")
            time.sleep(sleep_seconds)
