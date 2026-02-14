import os
from groq import Groq
from typing import List, Iterator


def _get_client(api_key: str | None = None) -> Groq:
    key = api_key or os.environ.get("GROQ_API_KEY", "")
    return Groq(api_key=key)


def ask(
    messages: List[dict],
    system_prompt: str,
    api_key: str | None = None,
) -> str:
    """
    Send messages to Groq (Llama 3.3 70B) and get a response.
    messages format: [{"role": "user", "content": "..."}, ...]
    """
    client = _get_client(api_key)

    all_messages = [{"role": "system", "content": system_prompt}] + messages

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=1024,
        messages=all_messages,
    )
    return response.choices[0].message.content


def ask_stream(
    messages: List[dict],
    system_prompt: str,
    api_key: str | None = None,
) -> Iterator[str]:
    """
    Stream Groq's response token by token.
    Yields text delta strings.
    """
    client = _get_client(api_key)

    all_messages = [{"role": "system", "content": system_prompt}] + messages

    stream = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=1024,
        messages=all_messages,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
