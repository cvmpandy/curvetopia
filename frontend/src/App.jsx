// frontend/src/App.js
import React, { useState } from 'react';
import DrawingCanvas from './DrawingCanvas'; // Import the canvas component
import './App.css'; // Keep or remove default App styling

function App() {
  const [currentDrawingPolyline, setCurrentDrawingPolyline] = useState([]);
  const [backendResponse, setBackendResponse] = useState(null);

  // This function is called by the DrawingCanvas when a stroke is finished
  const handleDrawingComplete = (polyline) => {
    console.log("Drawing stroke complete:", polyline);
    setCurrentDrawingPolyline(polyline); // For Phase 1, we'll just process the last stroke
    // In later phases, you'll add this polyline to a list of ALL strokes
  };

  // Function to send the drawing data to the backend
  const sendDrawingToBackend = async () => {
    if (currentDrawingPolyline.length === 0) {
      console.log("No drawing data to send.");
      return;
    }

    const backendUrl = 'http://127.0.0.1:8000/process_drawing'; // Or http://localhost:8000

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the polyline data in the expected format by the backend
        body: JSON.stringify({ points: currentDrawingPolyline }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log("Backend response:", result);
      setBackendResponse(result); // Store the response state to display if needed

      // Optional: Draw the processed data from the backend back onto the canvas
      // For Phase 1, the backend just returns the input, so this won't look different yet.
      // You would pass 'result.processed_data' back to the canvas component's props
      // and add logic there to draw these 'processed' points.

    } catch (error) {
      console.error("Error sending drawing to backend:", error);
      setBackendResponse({ error: error.message });
    }
  };

  return (
    <div className="App" style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Curvetopia Web Studio</h1>
      <p>Draw on the canvas and click "Process" to send data to the backend.</p>

      {/* Render the DrawingCanvas component */}
      <DrawingCanvas onDrawingComplete={handleDrawingComplete} />

      {/* Button to trigger the backend processing */}
      <button
        onClick={sendDrawingToBackend}
        style={{ margin: '20px', padding: '10px 20px', fontSize: '16px' }}
      >
        Process Drawing
      </button>

      {/* Display backend response (optional for debugging) */}
      {backendResponse && (
        <div style={{ marginTop: '20px' }}>
          <h2>Backend Response:</h2>
          <pre style={{ textAlign: 'left', maxWidth: '80%', margin: '0 auto', backgroundColor: '#f0f0f0', padding: '10px' }}>
            {JSON.stringify(backendResponse, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
}

export default App;