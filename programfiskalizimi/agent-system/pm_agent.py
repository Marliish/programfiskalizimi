#!/usr/bin/env python3
"""Product Manager Agent - Sara"""
import os
from agent_base import BaseAgent

class PMAgent(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__("pm", api_key)
        self.product_path = f"{self.workspace}/product"
    
    def execute_action(self, decision: str):
        self.log("Product planning...")
        sprint_1 = f"{self.product_path}/SPRINT_1_STORIES.md"
        if os.path.exists(sprint_1):
            self.log("✅ Sprint 1 stories exist")
        else:
            self.log("⏳ Sprint 1 needed")

if __name__ == "__main__":
    import sys
    agent = PMAgent(sys.argv[1])
    agent.run()
