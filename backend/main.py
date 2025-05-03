from fastapi import FastAPI , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class Polylinedata (BaseModel):
    points : list[list[float]]


app = FastAPI()

origins = [
    "http://localhost:5173",  # Default Vite port
    "http://127.0.0.1:5173"
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
def process_drawing(data : Polylinedata):
     """
    Endpoint to receive polyline data from the frontend.
    In this phase, we just receive and echo the data.
    """
     print("Received polyline data :")
     # print(data.points) # Uncomment if you want to see the points in backend terminal

     processed_points = data.points

    # regularization_result = apply_regularization(data.points)
    # symmetry_result = detect_symmetry(processed_result)
    # completion_result = complete_curves(symmetry_result)

     return {"received": True, "num_points": len(data.points), "processed_data": processed_points}
