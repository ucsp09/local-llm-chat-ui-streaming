import aiohttp
from fastapi.responses import StreamingResponse
from config import constants
from fastapi import HTTPException

def call_ollama_chat_api_with_streaming_response(session: aiohttp.ClientSession, model: str, messages: list):
    async def stream():
        try:
            url = f"{constants.OLLAMA_HOST}:{constants.OLLAMA_PORT}/api/chat"
            headers = {
                "Content-Type": "application/json"
            }
            payload = {
                "model": model,
                "messages": messages,
                "options": {
                    "num_predict": constants.OLLAMA_MAX_RESPONSE_TOKENS,
                    "num_ctx": constants.OLLAMA_CONTEXT_SIZE,
                    "temperature": constants.OLLAMA_DEFAULT_TEMPERATURE,
                },
                "stream": True
            }
            async with session.post(url=url, headers=headers, json=payload) as response:
                if response.status != 200:
                    raise HTTPException(status_code=500, detail=f"Ollama Chat API failed with status code:{response.status}")
                async for chunk in response.content.iter_any():
                    yield chunk
        except Exception as e:
             yield f'{{"error": "Unexpected error: {str(e)}"}}\n'.encode()
    
    return StreamingResponse(
        stream(),
        media_type="application/json",
        headers={
            "Cache-Control": "no-cache"
        })
