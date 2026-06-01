---
mode: agent
agent: developer
description: "Start development on KAN-8"
---

Read the file `.ticket-context.md` in the workspace root. It contains the full ticket context including:
- The Jira ticket description and requirements
- Parent ticket context (if this is a subtask)
- Sibling subtasks for awareness
- Team discussions from Slack
- Related past commits

Implement the changes described in the ticket. Work in this workspace directory.
If you need more context about the codebase or previous work, use the engmemory API at http://localhost:5051.
If you have questions that cannot be answered from the context, ask me.

When done:
1. Stage and commit your changes with message: `feat(KAN-8): <description>`
2. Summarize what you did
