# 💬 COMMUNICATION PROTOCOL
## How We Communicate as a Team

**Team Lead:** Marco
**Updated:** 2026-02-23
**Status:** Active

---

## 🎯 **COMMUNICATION PRINCIPLES**

1. **Default to Transparency** - Share openly, err on overcommunication
2. **Async First** - Respect focus time, use async methods
3. **Context Always** - Provide enough context in every message
4. **Choose Right Channel** - Use the appropriate tool for the message
5. **Respond Timely** - Honor response time expectations
6. **Document Decisions** - Write down what matters

---

## 🛠️ **COMMUNICATION TOOLS**

### **Slack** 💬
**Use for:**
- Quick questions and answers
- Daily coordination
- Urgent matters
- Team bonding
- Status updates

**Don't use for:**
- Long-form documentation
- Permanent knowledge storage
- Complex technical discussions

### **Linear** 📋
**Use for:**
- Task tracking
- Progress updates
- Bug reports
- Feature requests

**Don't use for:**
- General chat
- Questions
- Announcements

### **GitHub** 💻
**Use for:**
- Code reviews
- Technical discussions on code
- Bug reports (as issues)
- Documentation (markdown files)

**Don't use for:**
- General questions
- Project management
- Status updates

### **Figma** 🎨
**Use for:**
- Design collaboration
- Visual feedback
- UI/UX discussions

**Don't use for:**
- General chat
- Project updates

### **Meetings** 📞
**Use for:**
- Complex discussions needing real-time
- Sprint planning/reviews
- Brainstorming
- Resolving conflicts

**Don't use for:**
- Things that can be async
- Information sharing (write it instead)

---

## 💬 **SLACK CHANNELS**

### **#general**
**Purpose:** Company-wide announcements, wins, milestones
**Who:** Everyone
**Posting:** Important announcements only
**Mute:** No, keep notifications on

**Examples:**
- "🎉 Sprint 1 complete!"
- "🚀 Feature X deployed to production!"
- "📅 Team meeting tomorrow at 2 PM"

### **#dev**
**Purpose:** Technical discussions, architecture, code questions
**Who:** Developers, CTO
**Posting:** Technical topics only
**Mute:** Optional for non-devs

**Examples:**
- "Should we use REST or GraphQL for this endpoint?"
- "Anyone experienced with PostgreSQL full-text search?"
- "Code review needed: PR #42"

### **#design**
**Purpose:** Design feedback, UI/UX discussions
**Who:** Everyone (designers lead)
**Posting:** Design-related only
**Mute:** Optional

**Examples:**
- "Feedback on dashboard mockup?"
- "Which color palette works better?"
- "Icon suggestions for navigation?"

### **#team-lead**
**Purpose:** Daily progress, EOD updates, coordination
**Who:** Everyone posts, Marco monitors
**Posting:** Daily EOD updates required
**Mute:** No (Marco needs notifications)

**Format:**
```
📊 EOD Update - [Name] - [Date]
✅ COMPLETED: [tasks]
🔄 IN PROGRESS: [tasks]
🚧 BLOCKERS: [blockers]
```

### **#blockers**
**Purpose:** Urgent blockers that stop work
**Who:** Everyone can post, Marco monitors
**Posting:** Only real blockers
**Mute:** No (high priority)
**Response:** Marco within 15 min

**Examples:**
- "🚧 Can't access staging server"
- "🚧 API credentials not working"
- "🚧 Build failing on main branch"

### **#bugs**
**Purpose:** Bug reports and discussions
**Who:** Everyone
**Posting:** Structured bug reports
**Mute:** Optional

**Format:**
```
🐛 BUG: [Brief title]
📍 Where: [Feature/page]
🔍 Steps to reproduce:
1. [Step 1]
2. [Step 2]
✅ Expected: [Expected behavior]
❌ Actual: [Actual behavior]
🖼️ Screenshot: [If applicable]
```

### **#wins**
**Purpose:** Celebrate successes, share good news
**Who:** Everyone
**Posting:** Achievements, completed milestones
**Mute:** Optional

**Examples:**
- "✅ Just merged my first PR!"
- "🎉 Login feature is working perfectly!"
- "💪 Solved that tricky bug!"

### **#random**
**Purpose:** Off-topic, casual chat, team bonding
**Who:** Everyone
**Posting:** Non-work related, fun stuff
**Mute:** Yes (optional to participate)

**Examples:**
- Weekend plans
- Funny memes
- Coffee break chat
- Weather

---

## ⏱️ **RESPONSE TIME EXPECTATIONS**

| Priority | Channel | Response Time | Example |
|----------|---------|---------------|---------|
| 🔴 **CRITICAL** | #blockers + DM | **15 minutes** | Production down, work completely stopped |
| 🟠 **URGENT** | Slack mention | **1 hour** | Blocking task, needs quick decision |
| 🟡 **NORMAL** | Slack message | **4 hours** | General question, normal coordination |
| 🟢 **LOW** | Linear comment | **End of day** | Nice-to-have info, documentation |
| ⚪ **FYI** | Any channel | **No response needed** | Informational only |

### **After Hours:**
- Only respond to 🔴 CRITICAL issues
- Everything else waits until next working day
- Use phone for true emergencies

---

## 📝 **MESSAGE FORMATTING**

### **Use Emojis for Clarity:**
- ✅ Done/completed
- 🔄 In progress
- 📋 To do
- 🚧 Blocked
- ❌ Cancelled/won't do
- 💡 Idea/suggestion
- ❓ Question
- 🔴 Critical/urgent
- 🟡 Important
- 🟢 Low priority

### **Thread Conversations:**
- Keep related messages in threads
- Don't clutter main channel
- Use threads for detailed discussions

### **Tag People Appropriately:**
- `@name` - Direct someone's attention
- `@channel` - Everyone in channel (use sparingly!)
- `@here` - Everyone currently online (rare!)
- `@marco` - Tag team lead for blockers/decisions

### **Format Code:**
```
Use code blocks for code:
```javascript
const example = 'like this';
```

Use inline code for `variables` or `commands`
```

### **Be Clear and Specific:**

❌ **Bad:**
```
"The thing isn't working"
"Can someone help?"
"This is broken"
```

✅ **Good:**
```
"Login form validation isn't triggering on submit. 
Checked LoginPage.tsx line 45, the onSubmit handler.
Tried clearing cache. Any ideas?"
```

---

## 📞 **MEETINGS**

### **Daily Standup**
- **Time:** 10:00 AM CET
- **Duration:** 15 minutes sharp
- **Format:** Round-robin
- **Required:** Everyone
- **Camera:** Optional
- **Recording:** Yes (for those who miss)

### **Weekly Planning (Sprint Start)**
- **Time:** Monday 2:00 PM CET
- **Duration:** 2 hours
- **Format:** Collaborative planning
- **Required:** Everyone
- **Camera:** Preferred
- **Recording:** Yes

### **Sprint Review (Every 2 Weeks)**
- **Time:** Friday 2:00 PM CET
- **Duration:** 1 hour
- **Format:** Demos and discussion
- **Required:** Everyone
- **Camera:** Yes (for demos)
- **Recording:** Yes

### **Sprint Retrospective (Every 2 Weeks)**
- **Time:** Friday 3:00 PM CET
- **Duration:** 1 hour
- **Format:** Reflection and improvement
- **Required:** Everyone
- **Camera:** Yes
- **Recording:** Yes

### **Meeting Etiquette:**
- ✅ Join on time
- ✅ Mute when not speaking
- ✅ Have agenda ready
- ✅ Document action items
- ✅ Stay focused
- ❌ No multitasking
- ❌ Don't interrupt
- ❌ Don't go off-topic

---

## 🔇 **FOCUS TIME**

### **Deep Work Hours: 11AM-12PM, 2PM-4PM**

**During these hours:**
- Set Slack status: 🎯 "Deep Work"
- Turn off non-critical notifications
- Only respond to 🔴 CRITICAL issues
- Batch-check messages before/after

**To reach someone in deep work:**
- Only for blocking issues
- Use DM with clear urgency indicator
- Respect if they don't respond immediately

---

## 💬 **DIRECT MESSAGES (DMs)**

### **When to DM:**
- ✅ Sensitive feedback
- ✅ Personal matters
- ✅ Urgent blocking questions
- ✅ Private discussions
- ❌ Things that should be public knowledge
- ❌ Project updates (use channels)

### **DM Etiquette:**
- Say what you need upfront
- Don't just say "hi" and wait
- Provide context
- Respect response times

**Good DM:**
```
"Hey Marco! 👋 
I'm blocked on BE-042 - the API endpoint docs are unclear 
about the auth token format. Can you point me to the right 
docs or connect me with who knows?

Not urgent - whenever you have a moment today works!"
```

**Bad DM:**
```
"hey"
[waits for response]
"you there?"
[waits]
"I have a question"
```

---

## 📢 **STATUS UPDATES**

### **Slack Status Best Practices:**

Use status to show availability:
- 🎯 **Focusing** - Deep work, minimal interruptions
- ☕ **Break** - On a break, back soon
- 🍽️ **Lunch** - Away for lunch
- 🤒 **Sick** - Not available today
- 🏖️ **PTO** - On vacation [Date-Date]
- 💬 **Available** - Default, free to chat

### **Calendar:**
- Block focus time
- Mark PTO
- Update for meetings
- Share calendar with team

---

## 🎯 **DECISION MAKING**

### **Levels of Decision:**

**Level 1: Individual (Just Do It)**
- Your own task implementation
- Minor code style choices
- Tool preferences
**Process:** Decide and do, inform if relevant

**Level 2: Team Consultation (Discuss First)**
- Architecture approaches
- Design patterns
- API structure
**Process:** Post in #dev, gather input, decide

**Level 3: Team Lead Approval (Marco Decides)**
- Feature prioritization
- Resource allocation
- Process changes
**Process:** Discuss with Marco, he decides

**Level 4: CTO/CEO Approval (Escalate)**
- Technology stack changes
- Budget decisions
- Hiring decisions
**Process:** Marco escalates to Alex/Turi

### **Document Decisions:**
- Important decisions go in Linear (as comments)
- Architecture decisions in docs/
- Changes communicated in #general

---

## 🔄 **FEEDBACK CULTURE**

### **Giving Feedback:**
- ✅ Be specific and timely
- ✅ Focus on behavior, not person
- ✅ Provide examples
- ✅ Suggest improvements
- ✅ Balance criticism with praise

**Example:**
```
"In today's standup, the update was a bit unclear about 
what's actually complete vs in progress. For tomorrow, 
could you clearly separate completed tasks from ongoing ones? 
That helps me track our sprint velocity. Thanks!"
```

### **Receiving Feedback:**
- ✅ Listen without defending
- ✅ Ask clarifying questions
- ✅ Thank the person
- ✅ Act on it

### **Public vs Private:**
- Praise publicly (in channels, standups)
- Criticize privately (DMs, 1-on-1s)

---

## 🚨 **ESCALATION PATH**

1. **Try to solve yourself** (30 min)
2. **Ask teammate** (in relevant channel)
3. **Ask Marco** (DM or #team-lead)
4. **Marco escalates to CTO/CEO** if needed

**For critical production issues:**
- Skip to step 3 immediately
- Post in #blockers
- Tag Marco + Alex + Max

---

## 📊 **REPORTING**

### **Daily (5:30 PM):**
Everyone posts EOD update in #team-lead

### **Daily (6:00 PM):**
Marco sends summary to Turi (CEO)

### **Weekly (Friday 6:00 PM):**
Marco sends week summary to Turi

### **Sprint End:**
Team demos completed features

---

## 🌍 **TIMEZONE AWARENESS**

**Team Timezone:** CET (Central European Time)

**Core hours:** 10:00 AM - 5:00 PM CET

If working different timezone:
- Adjust your schedule to overlap core hours
- Use async communication
- Record meetings you can't attend

---

## ✅ **COMMUNICATION CHECKLIST**

Before sending a message, ask:

- [ ] Is this the right channel?
- [ ] Is this the right priority?
- [ ] Did I provide enough context?
- [ ] Did I specify what I need?
- [ ] Did I check documentation first?
- [ ] Will this be useful to others? (then post publicly)

---

## 📚 **EXAMPLES**

### **Good Question:**
```
#dev
Hey team! 👋

I'm working on BE-042 (user registration endpoint) and need 
to decide on password hashing strategy.

Options:
1. bcrypt (standard, slower)
2. Argon2 (newer, faster, more secure)

Our requirements:
- High security (handling fiscal data)
- ~10K users max
- Performance not critical

Leaning toward Argon2. Any concerns or preferences?

Context: This affects auth system, so wanted input before committing.

@alex (CTO input appreciated if you have time)
```

### **Good Update:**
```
#team-lead
📊 EOD Update - David - Feb 23

✅ COMPLETED TODAY:
- BE-001: Dev environment setup ✅
- BE-002: Node.js project initialized ✅

🔄 IN PROGRESS:
- BE-003: Fastify configuration (70% done)
  Will finish tomorrow morning

🚧 BLOCKERS:
- None

📅 TOMORROW:
- Complete Fastify setup
- Start database schema design
- Begin auth endpoint structure

💡 NOTES:
- Schema draft available for review in /docs/schema-draft.md
- All code pushed to main branch
```

### **Good Blocker Report:**
```
#blockers
🚧 BLOCKER: Staging Server Not Accessible

**Impact:** Can't deploy or test changes
**Who:** All developers
**Since:** 4:30 PM today

**Tried:**
- Checked credentials (correct)
- Tried different network (same issue)
- Pinged server (timeout)

**Need:** @max to check server status

**Urgency:** 🟠 High (blocking deployment, but can work locally)

@marco FYI
```

---

**Last Updated:** 2026-02-23 by Marco
**Next Review:** End of Sprint 1
