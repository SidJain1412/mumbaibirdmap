import uvicorn
# from prometheus_client import start_http_server

if __name__ == "__main__":
    # start_http_server(8080)
    # uvicorn.run("app:app", host="0.0.0.0", port=80, log_level="debug")
    uvicorn.run("app:app", reload=True)
