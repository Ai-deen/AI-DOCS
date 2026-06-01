"""Query engmemory for context. Usage: python .engmemory-ask.py <question>"""
import sys, httpx, json

API = "http://localhost:5051"
TICKET = "KAN-8"

def ask(question: str):
    """Get additional context from engmemory."""
    r = httpx.get(f"{API}/api/sessions/{TICKET}/context", timeout=10)
    ctx = r.json()
    print("=== TICKET CONTEXT ===")
    print(f"Ticket: {TICKET}")
    print(f"Prompt length: {len(ctx.get('prompt') or '')}")
    print()
    if ctx.get("context"):
        c = ctx["context"]
        if c.get("jira_comments"):
            print("=== JIRA COMMENTS ===")
            for comment in c["jira_comments"]:
                print(f"  - {comment}")
        if c.get("slack_messages"):
            print("=== SLACK MESSAGES ===")
            for msg in c["slack_messages"][-10:]:
                print(f"  - {msg}")
    print(f"\nYour question: {question}")
    print("(Check .ticket-context.md for full context)")

if __name__ == "__main__":
    q = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Show all context"
    ask(q)
