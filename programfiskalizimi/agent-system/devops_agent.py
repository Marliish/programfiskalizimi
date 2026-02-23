#!/usr/bin/env python3
"""DevOps Engineer Agent - Max"""
import os, subprocess
from agent_base import BaseAgent

class DevOpsAgent(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__("devops", api_key)
    
    def execute_action(self, decision: str):
        self.log("Checking infrastructure...")
        try:
            subprocess.run(['docker', 'ps'], capture_output=True, check=False)
            self.log("✅ Docker checked")
        except:
            self.log("⚠️ Docker not available")

if __name__ == "__main__":
    import sys
    agent = DevOpsAgent(sys.argv[1])
    agent.run()
