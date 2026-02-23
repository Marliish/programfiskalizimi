#!/usr/bin/env python3
"""Frontend Developer Agent - Elena"""
import os
from agent_base import BaseAgent

class FrontendAgent(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__("frontend", api_key)
        self.web_path = f"{self.workspace}/code/fiscalnext-monorepo/apps/web-admin"
    
    def execute_action(self, decision: str):
        self.log("Building UI components...")
        if os.path.exists(f"{self.web_path}/app/login/page.tsx"):
            self.log("✅ Login page exists")
        else:
            self.log("⏳ Login page needed")
        self.log("✅ Ready to build")

if __name__ == "__main__":
    import sys
    agent = FrontendAgent(sys.argv[1])
    agent.run()
