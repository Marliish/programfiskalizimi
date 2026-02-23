#!/usr/bin/env python3
"""Designer Agent - Luna"""
import os
from agent_base import BaseAgent

class DesignerAgent(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__("designer", api_key)
        self.designs_path = f"{self.workspace}/designs"
    
    def execute_action(self, decision: str):
        self.log("Working on designs...")
        design_system = f"{self.designs_path}/DESIGN_SYSTEM.md"
        if os.path.exists(design_system):
            self.log("✅ Design system exists")
        else:
            self.log("⏳ Design system needed")

if __name__ == "__main__":
    import sys
    agent = DesignerAgent(sys.argv[1])
    agent.run()
