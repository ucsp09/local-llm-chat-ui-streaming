import aiohttp
from core import schemas, ollama_raw
from config import constants
from bootstrap import get_session
from fastapi import HTTPException, Depends
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.routing import APIRouter
import os


router = APIRouter()

@router.get("/")
async def serve_index_html():
    file_path = "./static/index.html"
    if os.path.exists(file_path):
        return FileResponse(path=file_path, media_type="text/html")
    else:
        return HTMLResponse(content="<h1>Page Not Found</h1>", status_code=404, media_type="text/html")
    

@router.get("/{filename}.js")
async def serve_js_file(filename: str):
    file_path = f"./static/{filename}.js"
    if os.path.exists(file_path):
        return FileResponse(path=file_path, media_type="application/javascript")
    else:
        return HTMLResponse(content="<h1>File Not Found</h1>", status_code=404, media_type="text/html")


@router.get("/{filename}.css")
async def serve_css_file(filename: str):
    file_path = f"./static/{filename}.css"
    if os.path.exists(file_path):
        return FileResponse(path=file_path, media_type="text/css")
    else:
        return HTMLResponse(content="<h1>File Not Found</h1>", status_code=404, media_type="text/html")
    
@router.post("/api/v1/chat")
async def chat_completion_api(input_request: schemas.ChatCompletionAPIRequestSchema, session: aiohttp.ClientSession = Depends(get_session)):
    userMessage = input_request.message
    model = input_request.model
    modelProvider = input_request.modelProvider
    if model != constants.DEFAULT_MODEL:
        raise HTTPException(status_code=400, detail=f"Model {model} not supported")
    if modelProvider != constants.DEFAULT_MODEL_PROVIDER:
        raise HTTPException(status_code=400, detail=f"Model Provider {modelProvider} not supported")
    
    messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": userMessage}
    ]

    return ollama_raw.call_ollama_chat_api_with_streaming_response(
        session=session,
        model=model,
        messages=messages
    )
