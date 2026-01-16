from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.api import router
import bootstrap


print("Initializing app ...")
app = FastAPI()
print("Adding middlewares ...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_methods=["*"],
    allow_credentials=False
)
print("Adding routers ...")
app.include_router(router=router)
print("Adding event handlers ...")
app.add_event_handler('startup', bootstrap.startup_event_handler)
app.add_event_handler('shutdown', bootstrap.shutdown_event_handler)
print("App initialized successfully and started running !!!")  