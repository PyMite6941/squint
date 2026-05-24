import re


def clean_llm_output(raw: str) -> str:
    """Strip markdown fences, explanatory preambles, and trailing commentary."""
    fence_pattern = r"^```(?:tsx|typescript|jsx|javascript|js|ts)?\s*\n(.*?)\n```\s*$"
    match = re.search(fence_pattern, raw, re.DOTALL | re.MULTILINE)
    if match:
        raw = match.group(1)

    preambles = [
        "Here is the component:",
        "Here's the component:",
        "Here is the React component:",
        "Sure! Here is",
        "Here is the code:",
    ]
    for p in preambles:
        if raw.lstrip().startswith(p):
            raw = raw.lstrip()[len(p):].lstrip()

    lines = raw.split("\n")
    for i, line in enumerate(lines):
        stripped = line.strip()
        if (stripped.startswith("import ")
                or stripped.startswith("export ")
                or stripped.startswith("const ")
                or stripped.startswith("function ")):
            return "\n".join(lines[i:]).strip()

    return raw.strip()
