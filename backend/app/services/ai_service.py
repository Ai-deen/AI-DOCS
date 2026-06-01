import time
import logging
from openai import OpenAI, AzureOpenAI
from ..config import settings

logger = logging.getLogger(__name__)
MAX_RETRIES = 3


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
    elif settings.ai_provider == "groq":
        return OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=settings.groq_api_key,
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
    elif settings.ai_provider == "groq":
        return settings.groq_model
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


def _call_with_retry(client, **kwargs):
    """Call the AI API with retry logic for rate limits."""
    for attempt in range(MAX_RETRIES):
        try:
            return client.chat.completions.create(**kwargs)
        except Exception as e:
            if "429" in str(e) or "rate_limit" in str(e).lower():
                wait_time = 2 ** attempt * 5  # 5s, 10s, 20s
                logger.warning(f"Rate limited, retrying in {wait_time}s (attempt {attempt + 1}/{MAX_RETRIES})")
                time.sleep(wait_time)
            else:
                raise
    raise RuntimeError("Rate limit exceeded after retries. Please wait a moment and try again.")


async def analyze_document(content: str, analysis_type: str) -> dict:
    """Run AI analysis on document content."""
    start_time = time.time()

    prompt_template = ANALYSIS_PROMPTS.get(analysis_type, ANALYSIS_PROMPTS["summary"])
    prompt = prompt_template.format(content=content[:4000])  # Limit content to reduce tokens

    client = get_ai_client()
    model = get_model_name()

    try:
        response = _call_with_retry(
            client,
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert document analyst. Provide thorough, structured analysis with clear formatting using markdown."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500,
        )

        result = response.choices[0].message.content
        processing_time = time.time() - start_time

        return {
            "result": result,
            "processing_time": processing_time,
            "confidence_score": 0.85,
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
        response = _call_with_retry(
            client,
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

    prompt = f"""Generate 10-15 high-quality study flashcards from the following document.

Requirements for each flashcard:
- Questions must be informative and directly about the document's content
- Focus on key concepts, important facts, and core ideas that help the reader truly learn the material
- Include a mix of question types: "What", "Why", "How", and "Explain" questions
- Answers should be detailed enough to be educational (2-3 sentences), not just one-word responses
- Questions should test understanding, not just recall — help the user actually learn something
- Avoid trivial or surface-level questions

Return ONLY a JSON array of objects with "question" and "answer" fields. No other text.
Example format:
[
  {{"question": "What is the main purpose of X and why is it important?", "answer": "X serves to... This is important because..."}},
  {{"question": "How does Y work in the context of this document?", "answer": "Y works by... The key mechanism is..."}}
]

Document:
{content[:4000]}"""

    try:
        response = _call_with_retry(
            client,
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert educator who creates high-quality study materials. Generate informative flashcards that help learners deeply understand the document content. Each question should be thought-provoking and each answer should be educational. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=2000,
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
    except Exception as e:
        raise RuntimeError(f"AI service error: {str(e)}")
