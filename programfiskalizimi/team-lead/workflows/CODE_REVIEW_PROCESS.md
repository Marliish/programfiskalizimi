# 👀 CODE REVIEW PROCESS
## Quality Assurance Through Peer Review

**Team Lead:** Marco
**CTO:** Alex
**Updated:** 2026-02-23

---

## 🎯 **WHY CODE REVIEWS?**

- ✅ Catch bugs before they reach production
- ✅ Share knowledge across the team
- ✅ Maintain code quality standards
- ✅ Ensure consistency in coding style
- ✅ Learn from each other
- ✅ Build collective code ownership

---

## 👥 **REVIEW REQUIREMENTS**

### **All Code MUST Be Reviewed:**
- Backend code: At least 1 review (CTO for critical paths)
- Frontend code: At least 1 review (Designer input on UI)
- Infrastructure code: CTO review required
- Security-critical code: CTO review required

### **Who Can Review:**
- Any team member can review any code
- Encouraged to review outside your specialty
- CTO (Alex) reviews critical/security code

### **Review Turnaround:**
- Request review within 1 hour of PR creation
- Reviewers respond within 4 hours
- Approvals within 24 hours maximum

---

## 🔄 **CODE REVIEW WORKFLOW**

### **1. Developer: Create Pull Request**

**Before Creating PR:**
- [ ] Code is working locally
- [ ] All tests pass
- [ ] Code is formatted properly
- [ ] No console.log or debug code
- [ ] Comments added for complex logic

**PR Template:**
```markdown
## Description
[Brief description of what this PR does]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring

## Related Tasks
- Linear Task: [TASK-ID]
- Related PRs: [If any]

## What Changed?
- [Change 1]
- [Change 2]
- [Change 3]

## How to Test?
1. [Step 1]
2. [Step 2]
3. [Expected result]

## Screenshots (if UI change)
[Add screenshots or video]

## Checklist
- [ ] Code follows project standards
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Reviewed own code first

## Notes for Reviewers
[Any context that helps reviewers]
```

**Tag Reviewers:**
- Assign at least 1 reviewer
- Tag CTO for critical code
- Tag Designer for UI changes

---

### **2. Reviewer: Review the Code**

**Review Timeline:**
- Acknowledge receipt: Within 1 hour
- Complete review: Within 4 hours
- If urgent, within 1 hour

**What to Check:**

#### **Functionality:**
- [ ] Does the code do what it claims?
- [ ] Are edge cases handled?
- [ ] Are errors handled properly?
- [ ] Are inputs validated?

#### **Code Quality:**
- [ ] Is the code readable?
- [ ] Are variables/functions well-named?
- [ ] Is there duplicate code?
- [ ] Is complexity reasonable?
- [ ] Are comments helpful (not obvious)?

#### **Best Practices:**
- [ ] Follows project coding standards
- [ ] Uses appropriate design patterns
- [ ] No security vulnerabilities
- [ ] Performance considerations
- [ ] Database queries optimized

#### **Testing:**
- [ ] Tests are included
- [ ] Tests are meaningful
- [ ] Tests cover edge cases
- [ ] All tests pass

#### **Documentation:**
- [ ] README updated if needed
- [ ] API docs updated
- [ ] Complex logic explained
- [ ] Breaking changes documented

---

### **3. Reviewer: Provide Feedback**

**Feedback Types:**

#### **🔴 Must Fix (Blocking)**
Use when:
- Security vulnerability
- Breaking functionality
- Performance issue
- Violates critical standards

Format:
```
🔴 MUST FIX: [Issue]

[Detailed explanation]

Suggested fix:
[Code example or description]
```

#### **🟡 Should Fix (Recommended)**
Use when:
- Code quality issue
- Better approach exists
- Minor bug potential
- Readability concern

Format:
```
🟡 SUGGESTION: [Issue]

[Explanation]

Consider:
[Alternative approach]
```

#### **💡 Nice to Have (Optional)**
Use when:
- Small optimization
- Personal preference
- Learning opportunity
- Future improvement

Format:
```
💡 IDEA: [Suggestion]

[Brief explanation]

Not blocking, but might be worth considering.
```

#### **✅ Praise (Always)**
Highlight good code:
```
✅ Nice! [What was good]

[Why it's good]
```

---

### **4. Developer: Address Feedback**

**Response Requirements:**
- Acknowledge all feedback
- Address or respond to each comment
- Push changes or explain why not
- Request re-review when ready

**Response Format:**
```
✅ FIXED: [Commit hash]
💬 DISCUSSION: [Explanation of different approach]
❌ WONT FIX: [Reason]
```

**Iteration:**
- Push new commits with feedback addressed
- Don't force-push (preserves review history)
- Tag reviewer when ready for re-review

---

### **5. Reviewer: Approve or Request Changes**

**Approval Criteria:**
- All 🔴 MUST FIX items addressed
- Majority of 🟡 SUGGESTIONS addressed
- No new issues introduced
- Meets definition of done

**Actions:**
- ✅ **Approve:** Code is ready to merge
- 🔄 **Request Changes:** Must fix items remain
- 💬 **Comment:** Feedback given, no block

---

### **6. Developer: Merge**

**Merge Requirements:**
- At least 1 approval
- All checks passing (tests, linting)
- No unresolved comments (or marked wont-fix)
- Up to date with base branch

**Merge Strategy:**
- Use **Squash and Merge** for feature branches
- Use **Merge Commit** for release branches
- Delete branch after merge

---

## 🎓 **REVIEW BEST PRACTICES**

### **For Code Authors:**
- ✅ Keep PRs small (< 400 lines ideal)
- ✅ Write clear PR descriptions
- ✅ Review your own code first
- ✅ Respond to feedback promptly
- ✅ Be open to suggestions
- ❌ Don't take feedback personally
- ❌ Don't get defensive

### **For Reviewers:**
- ✅ Be constructive and respectful
- ✅ Explain the "why" behind feedback
- ✅ Suggest solutions, not just problems
- ✅ Acknowledge good code
- ✅ Ask questions instead of making demands
- ❌ Don't nitpick minor style issues
- ❌ Don't be vague ("this is bad")

---

## ⚡ **FAST-TRACK REVIEWS**

### **When to Fast-Track:**
- Hotfix for production bug
- Urgent feature deployment
- Blocking other team members

### **Process:**
1. Tag PR with `urgent` label
2. Message reviewer in Slack
3. Request within 1 hour review
4. Simplified review (focus on critical issues)

---

## 📏 **CODE STANDARDS CHECKLIST**

### **JavaScript/TypeScript:**
- [ ] Use TypeScript types (no `any`)
- [ ] Use async/await (not .then chains)
- [ ] Use meaningful variable names
- [ ] No unused imports/variables
- [ ] Consistent formatting (Prettier)
- [ ] ESLint passing

### **React/Next.js:**
- [ ] Use functional components
- [ ] Proper hooks usage
- [ ] No inline styles (use Tailwind)
- [ ] Accessibility attributes
- [ ] Proper key props in lists

### **Backend:**
- [ ] Input validation
- [ ] Error handling
- [ ] Database transactions where needed
- [ ] No SQL injection vulnerabilities
- [ ] API versioning considered

### **General:**
- [ ] No hardcoded secrets/credentials
- [ ] Environment variables used properly
- [ ] No console.log in production code
- [ ] Proper logging implementation
- [ ] Comments for complex logic only

---

## 🚨 **CRITICAL CODE PATHS**

**Require CTO Review:**
- Authentication/authorization
- Payment processing
- Fiscal data submission
- Database migrations
- Security configurations
- API authentication

---

## 📊 **REVIEW METRICS**

### **Tracked Weekly:**
- Average review time
- Number of revisions per PR
- PR size (lines of code)
- Review participation by team member

### **Goals:**
- Average review time: < 4 hours
- Average revisions: < 2
- Average PR size: < 400 lines
- All team members reviewing

---

## 💬 **COMMUNICATION**

### **In PR Comments:**
- Be specific about line numbers
- Use code suggestions feature
- Keep discussion focused
- Resolve when addressed

### **In Slack:**
- Use #code-reviews for general discussion
- DM for sensitive feedback
- Tag in #dev for technical questions

---

## 🎯 **DEFINITION OF DONE**

PR is ready to merge when:
- [ ] At least 1 approval
- [ ] All tests passing
- [ ] No linting errors
- [ ] All blocking feedback addressed
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Deployed to staging successfully

---

## 🔗 **RESOURCES**

- [Coding Standards](../../docs/ARCHITECTURE_BLUEPRINT.md#coding-standards)
- [Git Workflow](./GIT_WORKFLOW.md)
- [Testing Guidelines](./TESTING_GUIDELINES.md)

---

## 📝 **EXAMPLE REVIEW**

```markdown
## Review Comments:

### ✅ Great Things:
- Excellent test coverage!
- Clean separation of concerns
- Good error handling

### 🔴 MUST FIX:

**Line 45:** SQL Injection Vulnerability
The user input is directly concatenated into SQL query.

```typescript
// Current (vulnerable):
const query = `SELECT * FROM users WHERE id = ${userId}`;

// Should be:
const query = await prisma.user.findUnique({ where: { id: userId } });
```

### 🟡 SUGGESTIONS:

**Line 78:** Extract Complex Logic
This function is doing too much. Consider extracting validation logic.

```typescript
// Consider:
function validateUserInput(data) {
  // validation logic
}

function createUser(data) {
  const validated = validateUserInput(data);
  // creation logic
}
```

### 💡 IDEAS:

**Line 120:** Consider using a constant
The magic number "30" could be a named constant for clarity.

```typescript
const SESSION_TIMEOUT_DAYS = 30;
```

---

## Overall: 
Good work! Just need to fix the SQL injection issue and address the complexity concern. The rest are optional improvements. 

Let me know when ready for re-review! 👍
```

---

**Last Updated:** 2026-02-23 by Marco
**Next Review:** After first sprint
