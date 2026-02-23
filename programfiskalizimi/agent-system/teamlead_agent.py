#!/usr/bin/env python3
"""Team Lead Agent - Marco"""
import os, time
from agent_base import BaseAgent

class TeamLeadAgent(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__("teamlead", api_key)
        self.reports_path = f"{self.workspace}/reports/agents"
    
    def execute_action(self, decision: str):
        self.log("Checking team status...")
        for agent in ["cto", "backend", "frontend", "devops", "designer", "pm"]:
            log_file = f"{self.reports_path}/{agent}_log.md"
            if os.path.exists(log_file):
                age = (time.time() - os.path.getmtime(log_file)) / 3600
                self.log(f"✅ {agent} active ({age:.1f}h ago)")
        self.log("✅ Team check complete")

if __name__ == "__main__":
    import sys
    agent = TeamLeadAgent(sys.argv[1])
    agent.run()
