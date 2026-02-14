import anthropic
from typing import List, AsyncIterator
from app.config import settings


def _get_client(api_key: str | None = None) -> anthropic.Anthropic:
    key = api_key or settings.anthropic_api_key
    return anthropic.Anthropic(api_key=key)


async def ask(
    messages: List[dict],
    system_prompt: str,
    api_key: str | None = None,
) -> str:
    """
    Send messages to Claude and get a response.
    messages format: [{"role": "user", "content": "..."}, ...]
    """
    client = _get_client(api_key)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    )
    return response.content[0].text


async def ask_stream(
    messages: List[dict],
    system_prompt: str,
    api_key: str | None = None,
) -> AsyncIterator[str]:
    """
    Stream Claude's response token by token.
    Yields text delta strings.
    """
    client = _get_client(api_key)

    with client.messages.stream(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text
