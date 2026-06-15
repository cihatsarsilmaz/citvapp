from fastapi import FastAPI
import uvicorn

app = FastAPI(lifespan=None) # Yaşam döngüsünü (lifespan) tamamen kapattık

@app.get("/")
def home():
    return {"status": "Mühürlendi"}

if __name__ == "__main__":
    # log_config=None ile Uvicorn'un terminali izlemesini ve 
    # sinyallere tepki vermesini (kapanmasını) engelledik.
    uvicorn.run(app, host="0.0.0.0", port=5000, log_config=None)