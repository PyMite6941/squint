"""
Prompt testing harness. Run from backend/:
  GROQ_API_KEY=... python test_prompt.py

Drops .tsx files into test_outputs/ for manual review.
Goal: 7+/10 usable before shipping.
"""
import os
import base64
from pathlib import Path
from groq import Groq
from services.prompts import SYSTEM_PROMPT
from services.cleaner import clean_llm_output

client = Groq(api_key=os.environ["GROQ_API_KEY"])
TEST_DIR = Path("test_screenshots")
OUTPUT_DIR = Path("test_outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

images = list(TEST_DIR.glob("*.png")) + list(TEST_DIR.glob("*.jpg")) + list(TEST_DIR.glob("*.webp"))
if not images:
    print("No test images found in test_screenshots/. Add some PNGs and re-run.")
    raise SystemExit(0)

for img_path in images:
    print(f"Testing {img_path.name}...")
    mime = "image/png" if img_path.suffix == ".png" else "image/jpeg"
    with open(img_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": SYSTEM_PROMPT},
                {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
            ],
        }],
        temperature=0.2,
        max_tokens=4000,
    )

    cleaned = clean_llm_output(response.choices[0].message.content)
    out_path = OUTPUT_DIR / f"{img_path.stem}.tsx"
    out_path.write_text(cleaned, encoding="utf-8")
    print(f"  → {out_path}")

print(f"\nDone. Review {OUTPUT_DIR}/ — aim for 7+/10 usable before shipping.")
