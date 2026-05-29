import time
from openai import OpenAI, AzureOpenAI
from ..config import settings


def get_ai_client():
    """Get the appropriate AI client based on configuration."""
    if settings.ai_provider == "azure":
        return AzureOpenAI(
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint,
        )
    elif settings.ai_provider == "openrouter":
        return OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
        )
    elif settings.ai_provider == "ollama":
        return OpenAI(
            base_url=f"{settings.ollama_base_url}/v1",
            api_key="ollama",  # Ollama doesn't need a real key
        )
    else:
        return OpenAI(api_key=settings.openai_api_key)


def get_model_name():
    """Get the model name based on provider."""
    if settings.ai_provider == "azure":
        return settings.azure_openai_deployment
    elif settings.ai_provider == "openrouter":
        return settings.openrouter_model
    elif settings.ai_provider == "ollama":
        return settings.ollama_model
    else:
        return settings.openai_model


ANALYSIS_PROMPTS = {
    "summary": """Provide a comprehensive summary of the following document. 
Include the main topic, key arguments, and conclusions. Keep it concise but informative.

Document:
{content}""",

    "sentiment": """Analyze the sentiment of the following document. 
Provide:
1. Overall sentiment (positive, negative, neutral, mixed)
2. Sentiment score (-1.0 to 1.0)
3. Key phrases that indicate the sentiment
4. Emotional tone analysis

Document:
{content}""",

    "key_points": """Extract the key points from the following document.
Provide:
1. Main arguments or claims (numbered list)
2. Supporting evidence for each point
3. Any conclusions drawn
4. Action items (if any)

Document:
{content}""",

    "entities": """Extract all named entities from the following document.
Categorize them as:
1. People (names, roles)
2. Organizations (companies, institutions)
3. Locations (places, addresses)
4. Dates and Times
5. Financial figures
6. Technical terms
7. Products or services

Document:
{content}""",

    "full_analysis": """Perform a comprehensive analysis of the following document. Include:

1. **Executive Summary**: Brief overview (2-3 sentences)
2. **Key Points**: Main arguments and findings (numbered)
3. **Sentiment Analysis**: Overall tone and emotional indicators
4. **Named Entities**: Important people, organizations, dates, figures
5. **Themes & Topics**: Major themes identified
6. **Strengths**: What's well-presented
7. **Gaps/Weaknesses**: What's missing or unclear
8. **Recommendations**: Suggested actions or follow-ups
9. **Risk Assessment**: Any risks or concerns identified

Document:
{content}"""
}


async def analyze_document(content: str, analysis_type: str) -> dict:
    """Run AI analysis on document content."""
    start_time = time.time()

    prompt_template = ANALYSIS_PROMPTS.get(analysis_type, ANALYSIS_PROMPTS["summary"])
    prompt = prompt_template.format(content=content[:8000])  # Limit content length

    client = get_ai_client()
    model = get_model_name()

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert document analyst. Provide thorough, structured analysis with clear formatting using markdown."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000,
        )

        result = response.choices[0].message.content
        processing_time = time.time() - start_time

        return {
            "result": result,
            "processing_time": processing_time,
            "confidence_score": 0.85,  # Placeholder - could be enhanced
            "status": "completed"
        }
    except Exception as e:
        return {
            "result": f"Analysis failed: {str(e)}",
            "processing_time": time.time() - start_time,
            "confidence_score": 0.0,
            "status": "failed"
        }


async def chat_with_document(message: str, document_content: str = None) -> str:
    """Chat with AI about a document or general questions."""
    client = get_ai_client()
    model = get_model_name()

    messages = [
        {"role": "system", "content": "You are an AI assistant specialized in document analysis. Help users understand their documents, answer questions, and provide insights. Be concise and helpful."}
    ]

    if document_content:
        messages.append({
            "role": "system",
            "content": f"The user is asking about this document:\n\n{document_content[:6000]}"
        })

    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"I encountered an error: {str(e)}. Please check your AI provider configuration."


async def generate_flashcards(content: str) -> list[dict]:
    """Generate Q&A flashcards from document content."""
    client = get_ai_client()
    model = get_model_name()

    prompt = f"""Generate 8-12 study flashcards (question and answer pairs) from the following document.
Each flashcard should test understanding of a key concept, fact, or idea from the document.

Return ONLY a JSON array of objects with "question" and "answer" fields. No other text.
Example format:
[
  {{"question": "What is X?", "answer": "X is..."}},
  {{"question": "Why does Y happen?", "answer": "Y happens because..."}}
]

Document:
{content[:8000]}"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert educator. Generate clear, concise flashcards that help students learn key concepts. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=3000,
        )

        import json
        raw = response.choices[0].message.content.strip()
        # Handle potential markdown code blocks in response
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            raw = raw.rsplit("```", 1)[0]
        cards = json.loads(raw)
        if isinstance(cards, list):
            return [{"question": c["question"], "answer": c["answer"]} for c in cards if "question" in c and "answer" in c]
        return []
    except Exception:
        return []
