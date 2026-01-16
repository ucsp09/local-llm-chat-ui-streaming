import aiohttp
from typing import Optional
from config import constants

tcp_connector: Optional[aiohttp.TCPConnector] = None
client_timeout: Optional[aiohttp.ClientTimeout] = None
session: Optional[aiohttp.ClientSession] = None

def init_session():
    global tcp_connector, client_timeout, session
    if session is None:
        print("Initializing a singleton aiohttp client session ...")
        tcp_connector = aiohttp.TCPConnector(limit=constants.AIOHTTP_TCP_CONNECTOR_DEFAULT_LIMIT)
        client_timeout = aiohttp.ClientTimeout(total=constants.AIOHTTP_CLIENT_SESSION_DEFAULT_TIMEOUT)
        session = aiohttp.ClientSession(connector=tcp_connector, timeout=client_timeout)
        print("Initialization successfull !!!")
    else:
        print("session already initialized")

async def close_session():
    global session
    if session is not None:
        await session.close()

def get_session():
    global session
    return session

def startup_event_handler():
    print("Inside Startup event handler")
    init_session()

async def shutdown_event_handler():
    print("Inside Shutdown event handler")
    await close_session()
    
    