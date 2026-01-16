from pydantic import BaseModel

class ChatCompletionAPIRequestSchema(BaseModel):
    model: str
    modelProvider: str
    message: str

class ChatCompletionAPIResponseSchema(BaseModel):
    message: str
