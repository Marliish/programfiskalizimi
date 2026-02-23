#!/usr/bin/env python3
"""
Backend Developer Agent - David
Builds APIs, database, authentication
"""

import os
from agent_base import BaseAgent

class BackendAgent(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__("backend", api_key)
        self.api_path = f"{self.workspace}/code/fiscalnext-monorepo/apps/api"
    
    def execute_action(self, decision: str):
        """Execute backend development actions"""
        self.log("Building backend features...")
        
        # Check current state
        self.check_api_state()
        
        # Build next feature
        self.build_next_feature()
    
    def check_api_state(self):
        """Check current API development state"""
        self.log("Checking API state...")
        
        # Check if auth routes exist
        auth_routes = f"{self.api_path}/src/routes/auth.ts"
        if os.path.exists(auth_routes):
            self.log("✅ Auth routes exist")
        else:
            self.log("⏳ Auth routes not created yet")
    
    def build_next_feature(self):
        """Build the next feature on the list"""
        self.log("Determining next feature to build...")
        
        # Read sprint stories
        stories_path = f"{self.workspace}/product/SPRINT_1_STORIES.md"
        if os.path.exists(stories_path):
            with open(stories_path, "r") as f:
                content = f.read()
                self.log(f"Sprint 1 stories loaded, deciding what to build...")
        
        # For now, log that we're ready to build
        self.log("✅ Ready to build next backend feature")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python backend_agent.py <anthropic_api_key>")
        sys.exit(1)
    
    agent = BackendAgent(sys.argv[1])
    agent.run()
