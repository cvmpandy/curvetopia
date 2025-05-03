import React ,{useRef,useEffect,useState} from 'react';

const DrawingCanvas =({onDrawingComplete}) => {
    const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]); // Store points for the current stroke

  useEffect(() => {
    const canvas = canvasRef.current;
    // Set canvas size (adjust as needed)
    canvas.width = window.innerWidth * 0.8; // 80% of window width
    canvas.height = window.innerHeight * 0.6; // 60% of window height

    const context = canvas.getContext('2d');
    context.lineCap = 'round'; // Rounded ends for lines
    context.strokeStyle = 'black'; // Default drawing color
    context.lineWidth = 2; // Default line width
    contextRef.current = context;

    // Optional: Handle window resizing
    const handleResize = () => {
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.6;
        // Redraw existing content if you were storing it more persistently
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize); // Cleanup listener
  }, []); // Empty dependency array means this runs only once on mount

  // --- Mouse Event Handlers ---
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath(); // Start a new path
    contextRef.current.moveTo(offsetX, offsetY); // Move to the starting point
    setIsDrawing(true);
    setCurrentPath([[offsetX, offsetY]]); // Start storing the current path
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY); // Draw a line segment to the current point
    contextRef.current.stroke(); // Render the line segment
    setCurrentPath(prevPath => [...prevPath, [offsetX, offsetY]]); // Add point to current path
  };

  const stopDrawing = () => {
    contextRef.current.closePath(); // Close the current path
    setIsDrawing(false);
    if (currentPath.length > 1) { // Ensure it's more than just a click
        // Notify parent component that a drawing stroke is complete
        onDrawingComplete(currentPath);
    }
    setCurrentPath([]); // Reset current path for the next stroke
  };

  // Optional: Clear the canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    // You would also need to clear any stored paths here if you were managing multiple strokes
};

return (
    <div>
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing} // Stop drawing if mouse leaves canvas
            style={{ border: '1px solid black' }} // Add a border to see the canvas area
        />
        {/* Add a clear button for convenience */}
        {/* <button onClick={clearCanvas}>Clear Canvas</button> */}
    </div>
  );
};

export default DrawingCanvas;