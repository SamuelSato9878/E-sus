import uvicorn

def main():
   
    uvicorn.run(app="e_sus.server.server:app", host="localhost", port=8000, reload=True)

if __name__ == "__main__":
    main()
