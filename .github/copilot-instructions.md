# Workspace: KAN-8

This workspace is for implementing Jira ticket KAN-8.
The full context is in `.ticket-context.md` at the root.

## Agent Workflow
1. **@developer** implements the code changes
2. **@reviewer** reviews the implementation
3. **@tester** writes and runs tests

## Context API
- Full context: `GET http://localhost:5051/api/sessions/KAN-8/context`
- Ask questions: Check `.ticket-context.md` or query the API
- Report done: `POST http://localhost:5051/api/sessions/KAN-8/ai-response`
