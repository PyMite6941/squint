from backend.services.cleaner import clean_llm_output


def test_strips_tsx_fence():
    raw = "```tsx\nimport React from 'react';\nexport default function Foo() { return <div/>; }\n```"
    result = clean_llm_output(raw)
    assert result.startswith("import React")
    assert "```" not in result


def test_strips_typescript_fence():
    raw = "```typescript\nexport default function Bar() { return <div/>; }\n```"
    result = clean_llm_output(raw)
    assert result.startswith("export default")
    assert "```" not in result


def test_strips_bare_fence():
    raw = "```\nconst x = 1;\nexport default function Baz() { return <div/>; }\n```"
    result = clean_llm_output(raw)
    assert "```" not in result


def test_strips_preamble_here_is():
    raw = "Here is the component:\nimport React from 'react';\nexport default function Foo() {}"
    result = clean_llm_output(raw)
    assert result.startswith("import React")


def test_strips_preamble_heres():
    raw = "Here's the component:\nexport default function Foo() { return <div/>; }"
    result = clean_llm_output(raw)
    assert result.startswith("export default")


def test_finds_first_import_line():
    raw = "Some unexpected text\nmore text\nimport { X } from 'y';\nexport default function Z() {}"
    result = clean_llm_output(raw)
    assert result.startswith("import { X }")


def test_finds_first_export_line():
    raw = "Explanation here.\nexport default function Login() { return <main/>; }"
    result = clean_llm_output(raw)
    assert result.startswith("export default")


def test_passthrough_clean_code():
    code = "import { Search } from 'lucide-react';\nexport default function Page() { return <main/>; }"
    assert clean_llm_output(code) == code


def test_empty_input():
    assert clean_llm_output("") == ""


def test_strips_and_trims_whitespace():
    raw = "\n\n```tsx\nimport X from 'x';\nexport default function C() {}\n```\n\n"
    result = clean_llm_output(raw)
    assert not result.startswith("\n")
    assert not result.endswith("\n")
