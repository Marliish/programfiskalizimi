#!/usr/bin/env python3
"""
CTO Agent - Alex
Handles architecture, code reviews, security
"""

import os
import subprocess
from agent_base import BaseAgent

class CTOAgent(BaseAgent):
    def __init__(self, api_key: str):
        super().__init__("cto", api_key)
        self.code_path = f"{self.workspace}/code/fiscalnext-monorepo"
    
    def execute_action(self, decision: str):
        """Execute CTO-specific actions"""
        self.log("Executing CTO action")
        
        # Check code quality
        self.check_code_quality()
        
        # Review architecture
        self.review_architecture()
        
        # Check security
        self.check_security()
    
    def check_code_quality(self):
        """Check code quality standards"""
        self.log("Checking code quality...")
        
        # Check if ESLint config exists
        eslint_path = f"{self.code_path}/.eslintrc.json"
        if os.path.exists(eslint_path):
            self.log("✅ ESLint configuration present")
        else:
            self.log("⚠️  ESLint configuration missing")
    
    def review_architecture(self):
        """Review system architecture"""
        self.log("Reviewing architecture...")
        
        # Check database schema
        schema_path = f"{self.code_path}/packages/database/prisma/schema.prisma"
        if os.path.exists(schema_path):
            with open(schema_path, "r") as f:
                content = f.read()
                model_count = content.count("model ")
                self.log(f"✅ Database schema has {model_count} models")
        else:
            self.log("⚠️  Database schema not found")
    
    def check_security(self):
        """Security audit"""
        self.log("Running security checks...")
        
        # Check for .env files in git
        gitignore_path = f"{self.code_path}/.gitignore"
        if os.path.exists(gitignore_path):
            with open(gitignore_path, "r") as f:
                if ".env" in f.read():
                    self.log("✅ .env files are gitignored")
                else:
                    self.log("❌ SECURITY ISSUE: .env not in .gitignore!")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python cto_agent.py <anthropic_api_key>")
        sys.exit(1)
    
    agent = CTOAgent(sys.argv[1])
    agent.run()
