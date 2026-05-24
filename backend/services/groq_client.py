import os
from groq import Groq
from .prompts import SYSTEM_PROMPT
from .cleaner import clean_llm_output

_client: Groq | None = None

VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _client


def image_to_code(image_b64: str, mime_type: str) -> str:
    data_url = f"data:{mime_type};base64,{image_b64}"

    response = get_client().chat.completions.create(
        model=VISION_MODEL,
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": SYSTEM_PROMPT},
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        }],
        temperature=0.2,
        max_tokens=4000,
    )
    raw = response.choices[0].message.content
    return clean_llm_output(raw)
