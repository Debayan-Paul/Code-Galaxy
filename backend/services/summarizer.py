import os
from openai import AsyncOpenAI

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    
    # Configure the standard OpenAI SDK to point to Groq
    return AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1"
    )

async def summarize_file(file_content: str, filename: str) -> str:
    client = get_groq_client()
    if not client:
        return "No API Key provided. Could not generate summary."
        
    prompt = f"Analyze this file from a software project called '{filename}'. Provide a maximum 2-sentence summary of what its primary role/function is. Do not use formatting like bolding or bullet points. File contents:\n\n{file_content[:3000]}"
    
    # Valid Groq models: llama-3.3-70b-versatile, mixtral-8x7b-32768, etc.
    valid_models = [
        "llama-3.3-70b-versatile",
        "mixtral-8x7b-32768",
        "llama-3.1-70b-versatile"
    ]
    
    for model_name in valid_models:
        try:
            response = await client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=100,
                temperature=0.3
            )
            summary = response.choices[0].message.content
            if summary:
                return summary.strip()
            return "No summary generated."
        except Exception as e:
            print(f"Error calling Groq API with model {model_name} for {filename}: {str(e)}")
            continue
    
    return f"Failed to generate summary via Groq API. Please check API key and model availability."

