import os
import re
import time
from crewai import Agent, Crew, Task, Process, LLM
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

# ── Vision model selection ────────────────────────────────────────────────────
# Priority: GROQ_API_KEY → Groq vision
#           fallback    → OpenRouter (google/gemini-2.0-flash-exp:free)
GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
OR_VISION_MODEL   = "google/gemini-2.0-flash-exp:free"

# ── Text agent model pools (OpenRouter free) ──────────────────────────────────
_FAST_MODELS = [
    "openrouter/deepseek/deepseek-v4-flash:free",
    "openrouter/google/gemma-3-27b-it:free",
    "openrouter/meta-llama/llama-3.3-70b-instruct:free",
]
_SMART_MODELS = [
    "openrouter/qwen/qwen3-coder:free",
    "openrouter/google/gemini-2.0-flash-exp:free",
    "openrouter/deepseek/deepseek-v4-flash:free",
]

FRAMEWORK_GUIDE = {
    "react":    "React TypeScript (TSX). Default export `function ComponentName(): JSX.Element`. Tailwind CSS only.",
    "vue":      "Vue 3 SFC with `<template>`, `<script setup lang='ts'>`, and Tailwind CSS classes.",
    "html":     "Plain semantic HTML with Tailwind CSS CDN classes. No JS framework.",
    "tailwind": "Plain semantic HTML with Tailwind CSS CDN classes. No JS framework.",
}

VISION_PROMPT = """\
Analyze this UI screenshot in detail for a developer who needs to recreate it in code.

{query}

Cover every visible detail:
1. Layout structure — header, sidebar, main content, footer; their positions and proportions
2. Color palette — background, text, buttons, borders (match Tailwind color names where possible)
3. Typography — heading sizes, body sizes, font weights, visual hierarchy
4. All UI components — buttons, inputs, cards, tables, nav, badges, modals, etc.
5. Spacing & alignment — padding, gaps, margins between elements
6. Interactive elements — hover states, focus rings, toggles, dropdowns
7. Icons or images — describe what is visible
8. Overall visual style — minimal, bold, glass, corporate, playful, dark, light

Be as specific as possible. This description drives production code generation."""


class _ScreenshotInput(BaseModel):
    query: str = Field(default="Analyze this screenshot thoroughly.", description="Analysis instructions")


class VisionTool(BaseTool):
    """Calls a vision-capable model to analyze the uploaded screenshot.

    Uses Groq if GROQ_API_KEY is set; otherwise uses OpenRouter (google/gemini-2.0-flash-exp).
    Both are free-tier eligible.
    """
    name: str = "screenshot_analyzer"
    description: str = (
        "Analyzes a UI screenshot and returns a detailed description of its "
        "layout, color scheme, typography, components, spacing, and interactive elements."
    )
    args_schema: type[BaseModel] = _ScreenshotInput
    image_b64: str = Field(description="Base64-encoded image")
    mime_type: str = Field(default="image/png")
    groq_key: str = Field(default="")
    openrouter_key: str = Field(default="")

    def _run(self, query: str = "Analyze this screenshot thoroughly.") -> str:
        data_url = f"data:{self.mime_type};base64,{self.image_b64}"
        prompt = VISION_PROMPT.format(query=query)

        if self.groq_key:
            from groq import Groq
            client = Groq(api_key=self.groq_key)
            response = client.chat.completions.create(
                model=GROQ_VISION_MODEL,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                }],
                temperature=0.1,
                max_tokens=2000,
            )
            return response.choices[0].message.content

        # Fallback: OpenRouter via OpenAI-compatible client
        from openai import OpenAI
        client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=self.openrouter_key)
        response = client.chat.completions.create(
            model=OR_VISION_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }],
            max_tokens=2000,
        )
        return response.choices[0].message.content


def _extract_code(text: str) -> str:
    text = re.sub(r"^```(?:tsx?|typescript|javascript|jsx?|html|vue)?\s*\n?", "", text.strip(), flags=re.MULTILINE)
    text = re.sub(r"\n?```\s*$", "", text.strip(), flags=re.MULTILINE)
    text = text.strip()
    lines = text.split("\n")
    for i, line in enumerate(lines):
        s = line.strip()
        if s.startswith(("import ", "export ", "const ", "function ", "<template", "<!doctype", "<html")):
            return "\n".join(lines[i:]).strip()
    return text


class SquintCrew:
    def __init__(self, image_b64: str, mime_type: str, framework: str):
        self.image_b64 = image_b64
        self.mime_type = mime_type
        self.framework = framework
        self._groq_key = os.getenv("GROQ_API_KEY", "")
        self._or_key   = os.getenv("OPENROUTER_API_KEY", "")
        # LiteLLM (used by CrewAI internally) needs OPENAI_API_KEY for some paths
        if self._or_key:
            os.environ.setdefault("OPENAI_API_KEY", self._or_key)
        self._fast_idx  = 0
        self._smart_idx = 0

    def _fast_llm(self, temperature: float = 0.3) -> LLM:
        return LLM(
            model=_FAST_MODELS[self._fast_idx % len(_FAST_MODELS)],
            api_key=self._or_key,
            max_tokens=2048,
            max_retries=1,
            timeout=120,
            temperature=temperature,
        )

    def _smart_llm(self, temperature: float = 0.15) -> LLM:
        return LLM(
            model=_SMART_MODELS[self._smart_idx % len(_SMART_MODELS)],
            api_key=self._or_key,
            max_tokens=4096,
            max_retries=1,
            timeout=120,
            temperature=temperature,
        )

    def _build_agents(self):
        vision_tool = VisionTool(
            image_b64=self.image_b64,
            mime_type=self.mime_type,
            groq_key=self._groq_key,
            openrouter_key=self._or_key,
        )
        fw      = self.framework.upper()
        fw_rule = FRAMEWORK_GUIDE.get(self.framework, FRAMEWORK_GUIDE["react"])

        self.layout_reader = Agent(
            role="UI Screenshot Analyst",
            goal=(
                "Use the screenshot_analyzer tool to analyze the UI screenshot and produce "
                "a complete, structured description: layout, colors, typography, components, "
                "spacing, and interactive elements. Never guess — always use the tool."
            ),
            backstory=(
                "You are an expert UI analyst. You study interfaces and describe them with "
                "enough precision that a developer could recreate them without seeing the original."
            ),
            tools=[vision_tool],
            verbose=True,
            memory=False,
            llm=self._fast_llm(0.1),
            allow_delegation=False,
            cache=False,
        )

        self.architect = Agent(
            role="Component Architect",
            goal=f"Transform the UI description into a precise component blueprint for {fw}.",
            backstory=(
                f"You are a senior frontend architect specializing in {fw}. "
                "You translate UI descriptions into actionable blueprints: component name, "
                "imports, state variables, and top-level JSX structure. Never write full code."
            ),
            tools=[],
            verbose=True,
            memory=False,
            llm=self._fast_llm(0.3),
            allow_delegation=False,
            cache=False,
        )

        self.generator = Agent(
            role="Frontend Code Generator",
            goal=f"Write the complete, production-ready {fw} component that matches the UI exactly.",
            backstory=(
                f"You write clean {fw} code. Rules: {fw_rule}. Tailwind CSS only — no inline styles. "
                "Semantic HTML. lucide-react for icons. Placeholder images via placehold.co. "
                "Output ONLY the component source — zero markdown fences, zero explanations."
            ),
            tools=[],
            verbose=True,
            memory=False,
            llm=self._smart_llm(0.15),
            allow_delegation=False,
            cache=False,
        )

        self.polisher = Agent(
            role="Code Output Cleaner",
            goal="Strip all markdown fences and non-code text. Return only raw component source.",
            backstory=(
                "You receive generated code and remove every non-code artifact: "
                "markdown fences, preambles like 'Here is the component:', trailing commentary. "
                "You never modify logic — only strip artifacts."
            ),
            tools=[],
            verbose=True,
            memory=False,
            llm=self._fast_llm(0.0),
            allow_delegation=False,
            cache=False,
        )

    def _build_tasks(self):
        fw      = self.framework.upper()
        fw_rule = FRAMEWORK_GUIDE.get(self.framework, FRAMEWORK_GUIDE["react"])

        self.analyze_task = Task(
            description=(
                "Call the screenshot_analyzer tool with the instruction: "
                "'Analyze this screenshot thoroughly.' "
                "Then organize the response into 6 sections: "
                "1) Layout structure, 2) Color palette, 3) Typography, "
                "4) Component inventory, 5) Spacing & alignment, 6) Interactive elements. "
                "Do NOT write any code."
            ),
            expected_output="Detailed UI description in 6 labeled sections.",
            agent=self.layout_reader,
        )

        self.architect_task = Task(
            description=(
                f"Using the UI description, create a component blueprint for {fw}.\n"
                f"Framework: {fw_rule}\n\n"
                "Specify: 1) Component name, 2) Required imports, "
                "3) State variables (if any), 4) Top-level JSX structure (2-3 levels), "
                "5) Key Tailwind classes for major sections. No full code."
            ),
            expected_output="Blueprint: component name, imports, state, JSX hierarchy, Tailwind classes.",
            context=[self.analyze_task],
            agent=self.architect,
        )

        self.generate_task = Task(
            description=(
                f"Write the complete {fw} component from the UI description and blueprint.\n\n"
                f"Rules: {fw_rule}\n"
                "- Output ONLY component source. No markdown fences. No explanations.\n"
                "- Tailwind CSS utility classes only — no inline styles.\n"
                "- Semantic HTML elements throughout.\n"
                "- lucide-react: import only what you use.\n"
                "- Images: <img src='https://placehold.co/600x400' alt='...' />.\n"
                "- Transcribe all visible text exactly.\n"
                "- Responsive: flex/grid + md: prefixes.\n"
                "Start with imports. End with the default export."
            ),
            expected_output=f"Complete {fw} component — imports to default export, no markdown.",
            context=[self.analyze_task, self.architect_task],
            agent=self.generator,
        )

        self.polish_task = Task(
            description=(
                "Strip ALL non-code artifacts from the generated component:\n"
                "- Markdown fences: ```, ```tsx, ```typescript, etc.\n"
                "- Any text before the first import or component declaration\n"
                "- Any text after the last closing brace or tag\n"
                "Do NOT change the code. Return ONLY the raw source."
            ),
            expected_output="Raw component source — starts with imports, ends with closing brace/tag.",
            context=[self.generate_task],
            agent=self.polisher,
        )

    def run(self) -> str:
        max_rotations = max(len(_FAST_MODELS), len(_SMART_MODELS))
        for attempt in range(max_rotations):
            self._build_agents()
            self._build_tasks()
            crew = Crew(
                agents=[self.layout_reader, self.architect, self.generator, self.polisher],
                tasks=[self.analyze_task, self.architect_task, self.generate_task, self.polish_task],
                process=Process.sequential,
                verbose=True,
                memory=False,
            )
            try:
                result = crew.kickoff()
                raw = result.raw if hasattr(result, "raw") else str(result)
                return _extract_code(raw)
            except Exception as e:
                msg = str(e)
                if any(code in msg for code in ("429", "402", "503", "529")) and attempt < max_rotations - 1:
                    self._fast_idx  += 1
                    self._smart_idx += 1
                    print(f"[ROTATE] Rate limit on attempt {attempt + 1}, switching models")
                    time.sleep(2)
                    continue
                raise
        raise RuntimeError("All model rotation attempts exhausted")
