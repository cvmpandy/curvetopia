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
    // Apply dark background, light text, padding, centering to the main app container
    <div className="w-90 h-full bg-slate-700 text-slate-100 font-sans rounded-lg shadow-lg p-6 flex flex-col items-center">

      {/* Center content within a max-width container */}
      <div className="container  mx-auto flex flex-col items-center space-y-6">

        {/* Header */}
        <h1 className="text-5xl font-serif drop-shadow-lg text-slate-100 my-8">
          Curvetopia Web Studio 
        </h1>


        {/* Toolbar for tool selection and actions */}
        {/* Use flex and gap for horizontal spacing */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
            <button
                onClick={() => setActiveTool('freehand')}
                // Conditional classes for active state, rounded, padding, hover effect
                className={`px-6 py-3 rounded-xl font-mono transition-colors duration-200 ${
                    activeTool === 'freehand'
                        ? 'bg-rose-700 text-slate-100  shadow-md' // Active state style
                        : 'bg-rose-600 hover:bg-rose-700 text-slate-100' // Inactive + hover style
                }`}
            >
                Freehand Tool
            </button>
            <button
                onClick={() => setActiveTool('eraser')}
                className={`px-6 py-3 rounded-xl font-mono transition-colors duration-200 ${
                    activeTool === 'eraser'
                        ? 'bg-rose-700 text-slate-100 shadow-md' // Active state style
                        : 'bg-rose-600 hover:bg-rose-700 text-slate-100' // Inactive + hover style
                }`}
            >
                Eraser Tool
            </button>
            
        </div>


        {/* Render the DrawingCanvas component */}
        {/* Wrap canvas in a div for styling border, shadow, rounded corners, and width */}
        {/* Pass styling classes to the wrapper div */}
        <div className="w-full max-w-4xl bg-slate-800 border border-slate-700 shadow-lg rounded-lg overflow-hidden"> {/* overflow-hidden is good practice with rounded corners */}
            <DrawingCanvas
               ref={canvasRef}
               tool={activeTool}
               // Consider passing dynamic stroke color/width based on tool here
               strokeColor={activeTool === 'eraser' ? 'rgba(200, 200, 200, 0.5)' : 'white'} // Draw in white on dark background
               strokeWidth={activeTool === 'eraser' ? 20 : 2} // Make eraser cursor wider visually
               // The style prop here is primarily for canvas element's own style (like cursor)
               style={{ cursor: activeTool === 'eraser' ? 'crosshair' : 'default' }}
               // Let the parent div handle border, shadow, etc.
            />
         </div>

         <div className="flex flex-wrap justify-center gap-4 mb-6"> 
         <button
                onClick={sendDrawingToBackend}
                className="px-6 py-3 rounded-xl font-mono  bg-green-600 hover:bg-green-700 transition-colors duration-200 text-white shadow-md"
            >
              Process Drawing
            </button>
            <button
               onClick={handleClearCanvas}
               className="px-6 py-3 rounded-xl font-mono bg-red-600 hover:bg-red-700 transition-colors duration-200 text-white shadow-md"
            >
                Clear Canvas
            </button>
         </div>

        {/* Display backend response */}
        {backendResponse && (
          <div className="w-full max-w-4xl mt-8 p-6 bg-slate-800 rounded-lg shadow-md text-slate-100 text-left font-mono text-sm overflow-x-auto">
            <h2 className="text-lg font-semibold mb-4 text-slate-300">Backend Response:</h2>
            <pre className="whitespace-pre-wrap break-words"> {/* Added for better word wrapping */}
              {/* Use JSON.stringify for better formatting of the response object */}
              {JSON.stringify(backendResponse, null, 2)}
            </pre>
          </div>
        )}

      </div> {/* End container */}
    </div> // End main app container
  );
}

export default App;