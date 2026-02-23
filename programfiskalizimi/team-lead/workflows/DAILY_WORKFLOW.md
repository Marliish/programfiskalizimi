# ⏰ DAILY WORKFLOW
## Team Cadence & Processes

**Team Lead:** Marco
**Updated:** 2026-02-23
**Status:** Active

---

## 📅 **DAILY SCHEDULE**

### **9:00 AM - Day Starts**
**All Team Members:**
- Check Slack for overnight messages
- Review today's task assignments in Linear
- Check if any blockers from yesterday

**Marco (Team Lead):**
- Review yesterday's progress
- Check active blockers
- Prepare standup agenda
- Review task board updates

---

### **10:00 AM - Daily Standup** (15 minutes)

**Format: Round-Robin**

Each team member answers 3 questions (2 min each):
1. ✅ What did I complete yesterday?
2. 🔄 What am I working on today?
3. 🚧 Do I have any blockers?

**Order:**
1. Alex (CTO)
2. Sara (Product Manager)
3. David (Backend Dev)
4. Elena (Frontend Dev)
5. Luna (Designer)
6. Max (DevOps)
7. Marco (Team Lead) - last

**After round-robin:**
- Discuss blockers (5 min max)
- Clarify dependencies
- Confirm day's priorities

**Rules:**
- Start on time, end on time
- Stay focused (no deep technical discussions)
- Take detailed discussions offline
- Document action items

---

### **10:15 AM - Post-Standup**

**Marco:**
- Update task board based on standup
- Assign any new tasks
- Follow up on blockers
- Send standup summary to Slack

**Team:**
- Start working on today's tasks
- Coordinate with dependencies identified

---

### **12:00 PM - Mid-Day Check**

**Marco:**
- Quick Slack check-in
- Monitor progress in Linear
- Answer questions
- Help with blockers

**Team:**
- Continue focused work
- Reach out if blocked

---

### **3:00 PM - Afternoon Sync**

**Marco:**
- Check task progress
- Identify risks for today's deliverables
- Proactive blocker removal
- Coordinate any urgent needs

**Team:**
- Push work in progress
- Flag if tasks won't complete today

---

### **5:00 PM - Code Freeze for Day**

**All Developers:**
- Push all code commits
- Update task status in Linear
- Document any WIP notes

**Required Commits:**
- All code written today must be committed
- Even if incomplete (use WIP branches)
- Include descriptive commit messages

---

### **5:30 PM - End of Day Updates**

**All Team Members → Post in Slack #team-lead:**

Template:
```
📊 EOD Update - [Your Name] - [Date]

✅ COMPLETED TODAY:
- [Task 1 with ID]
- [Task 2 with ID]

🔄 IN PROGRESS:
- [Task 3 with ID] - 60% done, will finish tomorrow

🚧 BLOCKERS:
- [None / List any blockers]

📅 TOMORROW:
- [Planned tasks]

💬 NOTES:
- [Any important context]
```

**Example:**
```
📊 EOD Update - David - Feb 23

✅ COMPLETED TODAY:
- BE-001: Setup dev environment
- BE-002: Initialize Node.js project

🔄 IN PROGRESS:
- BE-003: Configure Fastify - 70% done
- BE-005: Database schema - draft ready

🚧 BLOCKERS:
- None

📅 TOMORROW:
- Complete Fastify setup
- Finalize and commit database schema
- Start auth endpoints

💬 NOTES:
- Schema draft is in /docs/schema-draft.md for review
```

---

### **5:45 PM - Marco's Daily Review**

**Marco reviews all EOD updates:**
- Check completion rate vs plan
- Identify slipped tasks
- Document blockers
- Prepare tomorrow's priorities
- Update metrics

---

### **6:00 PM - Report to CEO**

**Marco → Turi (CEO Assistant):**

Daily summary format:
```
📊 DAILY REPORT - [Date]

✅ COMPLETED TODAY: [X/Y tasks]
- [Key accomplishments]

🔄 IN PROGRESS: [X tasks]
- [Critical ongoing work]

🚧 BLOCKERS: [X blockers]
- [Any blockers]

📈 METRICS:
- Team availability: X/7
- Code commits: X
- Tasks completed: X
- Velocity: On track / Behind / Ahead

📅 TOMORROW'S FOCUS:
- [Top 3 priorities]

💡 HIGHLIGHTS:
- [Wins, demos, important notes]

🚨 NEEDS ATTENTION:
- [Anything CEO should know]
```

---

### **6:00 PM - Day Ends**

**Team members can log off**
- Optional to continue working
- No expectation to respond to messages
- Async communication welcomed

---

## 🔄 **ASYNC COMMUNICATION GUIDELINES**

### **Response Time Expectations:**

| Priority | Response Time | Channels |
|----------|---------------|----------|
| 🔴 **CRITICAL** | 15 min | Slack DM + #blockers |
| 🟠 **URGENT** | 1 hour | Slack mention |
| 🟡 **NORMAL** | 4 hours | Slack message |
| 🟢 **LOW** | End of day | Linear comment |

### **After Hours:**
- 🔴 Critical production issues only
- Use phone for emergencies
- Otherwise, wait until next day

---

## 💻 **WORKING HOURS**

### **Core Hours (Everyone Online):**
- **10:00 AM - 5:00 PM CET**
- Must be available during this time
- Attend all standups

### **Flexible Hours:**
- **9:00 AM - 10:00 AM:** Flexible start
- **5:00 PM - 6:00 PM:** Flexible end
- Total: 8 hours per day

### **Time Off:**
- Notify Marco at least 24 hours in advance
- Mark in shared calendar
- Update Slack status
- Coordinate task handoff if needed

---

## 📝 **TASK MANAGEMENT**

### **Task Lifecycle:**

1. **📋 TODO**
   - Task created in Linear
   - Assigned to team member
   - Has clear acceptance criteria

2. **🔄 IN_PROGRESS**
   - Team member starts work
   - Updates status in Linear
   - Commits code regularly

3. **👀 IN_REVIEW**
   - Code pushed to PR
   - Requests review
   - Responds to feedback

4. **✅ DONE**
   - Code merged
   - Deployed to staging
   - Verified working
   - Documentation updated

### **Task Updates:**
- Update status at least daily
- Add comments for significant progress
- Tag people for questions
- Link related PRs/commits

---

## 🤝 **COLLABORATION PATTERNS**

### **When You Need Help:**
1. Try to solve it yourself (30 min max)
2. Search documentation/Google (15 min)
3. Ask in relevant Slack channel
4. Tag specific person if needed
5. Escalate to Marco if blocked > 1 hour

### **Pair Programming:**
- Encouraged for complex tasks
- Schedule with teammate
- Use screen share
- Rotate driver/navigator every 30 min

### **Code Reviews:**
- Request review within 1 hour of PR creation
- Reviewers respond within 4 hours
- Address feedback promptly
- Merge after approval

---

## 🎯 **FOCUS TIME**

### **Deep Work Blocks:**
- **11:00 AM - 12:00 PM:** Focus time (minimize interruptions)
- **2:00 PM - 4:00 PM:** Deep work block

### **During Focus Time:**
- Set Slack status to 🎯 "Focusing"
- Only respond to critical issues
- Turn off non-critical notifications

---

## 📊 **WEEKLY RHYTHMS**

### **Monday:**
- **10:00 AM:** Daily standup
- **2:00 PM:** Weekly planning (Sprint start every 2 weeks)
- Focus: Set up the week

### **Tuesday - Thursday:**
- **10:00 AM:** Daily standup
- Focus: Execute tasks

### **Friday:**
- **10:00 AM:** Daily standup
- **2:00 PM:** Sprint review (every 2 weeks)
- **3:00 PM:** Sprint retrospective (every 2 weeks)
- Focus: Wrap up, review, improve

---

## 🎉 **TEAM MORALE**

### **Celebrations:**
- Share wins in #general
- Demo completed features in sprint review
- Recognize great work in standups

### **Feedback:**
- Give feedback regularly (daily if needed)
- Be specific and actionable
- Praise publicly, critique privately

### **Team Building:**
- Virtual coffee chats
- Casual #random channel
- Celebrate milestones

---

## 📞 **EMERGENCY PROCEDURES**

### **Production Down (Post-Launch):**
1. Alert #incidents channel
2. Tag Marco + Alex + Max
3. Jump on emergency call
4. Follow incident protocol

### **Critical Blocker:**
1. Post in #blockers
2. Tag @marco
3. Include: what, impact, tried solutions
4. Marco responds within 15 min

---

## 🔗 **TOOLS & LINKS**

### **Daily Tools:**
- **Slack:** Team communication
- **Linear:** Task management
- **GitHub:** Code repository
- **Figma:** Design collaboration

### **Quick Links:**
- [Task Board](../task-boards/week-01.md)
- [Active Blockers](../blockers/active-blockers.md)
- [Standup Notes](../standups/)
- [Team Lead System](../TASK_TRACKING_SYSTEM.md)

---

## ✅ **DAILY CHECKLIST**

### **For All Team Members:**
- [ ] Join daily standup at 10:00 AM
- [ ] Update task status in Linear
- [ ] Push code commits by 5:00 PM
- [ ] Post EOD update by 5:30 PM
- [ ] Respond to mentions within SLA

### **For Marco:**
- [ ] Prepare standup agenda (9:00 AM)
- [ ] Facilitate standup (10:00 AM)
- [ ] Update task board (10:15 AM)
- [ ] Mid-day check-in (12:00 PM)
- [ ] Afternoon sync (3:00 PM)
- [ ] Review EOD updates (5:45 PM)
- [ ] Send daily report to CEO (6:00 PM)

---

**Last Updated:** 2026-02-23 by Marco
**Next Review:** End of Week 1 (retrospective)
