from fastapi import FastAPI , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List 


# Define a Pydantic model for a single point
class Point(BaseModel):
    x: float
    y: float

class Polyline(BaseModel):
    points: List[Point]

# class DrawingData(BaseModel):
#     # Expecting a list of polylines, where each polyline is a list of [float, float] points
#     points: List[Polyline]

class DrawingData(BaseModel):
    # Expecting a list of polylines, where each polyline is a list of [float, float] points
    points: List[List[List[float]]]


app = FastAPI()

origins = [
    "http://localhost:5173",  # Default Vite port
    "http://127.0.0.1:5173",

]

app.add_middleware(
    CORSMiddleware,
    allow_origins =origins,
    allow_credentials = True,
    allow_methods =["*"],
    allow_headers = ["*"]
)

@app.get("/")
def read_root():
    """Basic endpoint to confirm backend is running."""
    return {"message": "Curvetopia Backend is running!"}


@app.post("/process_drawing")
def process_drawing(data : DrawingData):
     """
    Endpoint to receive polyline data from the frontend.
    In this phase, we just receive and echo the data.
    """
     num_polylines = len(data.points)
     print(f"Received {num_polylines} polylines from frontend.")

     processed_data = data.points

    # regularization_result = apply_regularization(data.points)
    # symmetry_result = detect_symmetry(processed_result)
    # completion_result = complete_curves(symmetry_result)

     return {
        "status": "received",
        "num_polylines_received": num_polylines,
        "processed_data": processed_data # Echoing received data
    }
