import React, { useRef, useEffect, useState ,forwardRef, useImperativeHandle } from 'react';

const DrawingCanvas = forwardRef(({tool , onDrawingComplete , ...props},ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]); // Current stroke
  const [allStrokes, setAllStrokes] = useState([]);   // All completed strokes

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.6;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    contextRef.current = context;

    const handleResize = () => {
      canvas.width = window.innerWidth * 0.8;
      canvas.height = window.innerHeight * 0.6;
      redrawAllStrokes(); // Redraw after resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!context) return; // Ensure context is initialized

    // Clear the entire canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all stored strokes
    allStrokes.forEach(stroke => {
        context.beginPath();
        context.moveTo(stroke[0][0], stroke[0][1]); // Move to the first point
        stroke.slice(1).forEach(point => { // Loop through remaining points
            context.lineTo(point[0], point[1]); // Draw lines to subsequent points
        });
        context.stroke(); // Render the stroke
    });

    // Note: This redraws *all* strokes with the *current* context settings (color, width).
    // In Phase 6, you might store color/width per stroke.
}, [allStrokes]); // Dependency array: run this effect whenever allStrokes state changes

useImperativeHandle(ref, () => ({
    getAllStrokes: () => allStrokes, // Function to return all strokes
    // Add other methods later, e.g., clearCanvas, setTool, etc.
}));

  // Start a stroke
  const startDrawing = ({ nativeEvent }) => {

    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    setCurrentPath([[offsetX, offsetY]]);
  };

  // Continue drawing
  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
    setCurrentPath(prev => [...prev, [offsetX, offsetY]]);
  };

  // End a stroke and store it
  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    contextRef.current.closePath();

    if (currentPath.length > 1) {
      const newStrokes = [...allStrokes, currentPath];
      setAllStrokes(newStrokes);
      redrawAllStrokes(newStrokes); // Redraw everything

      if (onDrawingComplete) {
        onDrawingComplete(currentPath);
      }
    }

    setCurrentPath([]);
  };

  // Redraw the canvas from stored strokes
  const redrawAllStrokes = (strokes = allStrokes) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.lineCap = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = 2;

    strokes.forEach(path => {
      if (path.length > 1) {
        context.beginPath();
        context.moveTo(path[0][0], path[0][1]);
        for (let i = 1; i < path.length; i++) {
          context.lineTo(path[i][0], path[i][1]);
        }
        context.stroke();
        context.closePath();
      }
    });
  };

  // Clear everything
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    setAllStrokes([]);
    setCurrentPath([]);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        style={{ border: '1px solid black' }}
      />
      <button onClick={clearCanvas} style={{ marginTop: '10px' }}>
        Clear Canvas
      </button>
    </div>
  );
});

export default DrawingCanvas;
