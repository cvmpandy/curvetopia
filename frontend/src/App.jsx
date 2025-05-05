// frontend/src/App.js
import React, { useState, useRef } from 'react';
import DrawingCanvas from './DrawingCanvas'; // Import the canvas component
import './App.css'; // Keep or remove default App styling
//import './styles.css'; // Optional: Add some basic styles here

function App() {
  const canvasRef = useRef(null); // Create a ref for the DrawingCanvas component
  const [backendResponse, setBackendResponse] = useState(null);
  const [activeTool, setActiveTool] = useState('freehand'); // State to track the currently active tool ('freehand' or 'eraser')

  // Function to send ALL drawing data to the backend
  const sendDrawingToBackend = async () => {
    // Get all strokes data from the DrawingCanvas component using the ref
    // We rely on the canvas component to give us its current state of all drawn polylines
    const allStrokes = canvasRef.current ? canvasRef.current.getAllStrokes() : [];

    if (allStrokes.length === 0) {
      console.log("No drawing data to send.");
      setBackendResponse({ message: "No drawing data to send." });
      return;
    }
    // --- IMPORTANT CHANGE HERE: Transform data for backend ---
    // The backend now expects a structure like:
    // [ [ {x: x1, y: y1}, {x: x2, y: y2}, ... ], [ {x: x'1, y: y'1}, ... ], ... ]
    const transformedStrokes = allStrokes.map(polyline =>
      polyline.map(point => ({ x: point[0], y: point[1] }))
  );
   
    const backendUrl = 'http://127.0.0.1:8000/process_drawing'; // Or http://localhost:8000

    try {
      console.log(`Sending ${transformedStrokes.length} strokes to backend...`);
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the list of polylines in the expected format by the backend
        body: JSON.stringify({ points: transformedStrokes }),
      });

      // Check if the request was successful
      if (!response.ok) {
        // Attempt to read the error response body
        const errorText = await response.text();
        console.error("Backend error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log("Backend response:", result);
      setBackendResponse(result); // Store the response state to display

      // TODO: In later phases, you will use 'result.processed_data'
      // to update the canvas visualization. For now, we just display the raw response.

    } catch (error) {
      console.error("Error sending drawing to backend:", error);
      setBackendResponse({ error: error.message });
    }
  };

  // Function to clear the canvas
  const handleClearCanvas = () => {
      if (canvasRef.current) {
          canvasRef.current.clearCanvas();
          setBackendResponse(null); // Clear previous backend response
      }
  };

  return (
    <div className="App" style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Curvetopia Web Studio</h1>
      <p>Draw on the canvas using different tools.</p>

      {/* Toolbar for tool selection and actions */}
      <div style={{ marginBottom: '15px' }}>
          <button
              onClick={() => setActiveTool('freehand')}
              // Add a simple style to indicate active tool
              style={{ marginRight: '10px', fontWeight: activeTool === 'freehand' ? 'bold' : 'normal' }}
          >
              Freehand Tool
          </button>
          <button
              onClick={() => setActiveTool('eraser')}
              style={{ marginRight: '10px', fontWeight: activeTool === 'eraser' ? 'bold' : 'normal' }}
          >
              Eraser Tool
          </button>
          <button
              onClick={sendDrawingToBackend}
              style={{ marginRight: '10px' }}
          >
            Process Drawing
          </button>
          <button onClick={handleClearCanvas}>
              Clear Canvas
          </button>
      </div>


      {/* Render the DrawingCanvas component */}
      {/* Pass the active tool and ref down to the canvas */}
      <DrawingCanvas
         ref={canvasRef}
         tool={activeTool} // Pass the current active tool
         // You could pass other props like stroke color or width here too
         strokeColor={activeTool === 'eraser' ? 'rgba(255,0,0,0.5)' : 'black'} // Optional: Visual cue for eraser (won't affect erasing logic itself in this basic setup)
         strokeWidth={activeTool === 'eraser' ? 10 : 2} // Optional: Visual cue for eraser width
         style={{ border: '1px solid #ccc', cursor: activeTool === 'eraser' ? 'crosshair' : 'default' }} // Add border and change cursor
      />

      {/* Display backend response (optional for debugging/feedback) */}
      {backendResponse && (
        <div style={{ marginTop: '20px' }}>
          <h2>Backend Response:</h2>
          <pre style={{ textAlign: 'left', maxWidth: '90%', margin: '0 auto', backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '5px', overflowX: 'auto' }}>
            {/* Use JSON.stringify for better formatting of the response object */}
            {JSON.stringify(backendResponse, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
}

export default App;