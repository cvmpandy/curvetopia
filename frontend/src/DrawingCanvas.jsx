import React, { useRef, useEffect, useState ,forwardRef, useImperativeHandle } from 'react';

// forwardRef to allow parent component (App.js) to get a ref to this component's DOM node or exposed methods
const DrawingCanvas = forwardRef(({tool ,strokeColor = 'black', strokeWidth = 2, onDrawingComplete , ...props},ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]); // Points for the current stroke being drawn or erased
  const [allStrokes, setAllStrokes] = useState([]);   // Stores completed strokes (list of lists of points)

  // Expose methods to the parent component via the ref
  useImperativeHandle(ref, () => ({
    getAllStrokes: () => allStrokes,
    clearCanvas: () => {
        // Clear the state and the canvas visually
        setAllStrokes([]);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
    // Could expose other methods here later, e.g., addStroke, setTool
  }));

  // Initialize canvas context and resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Ensure canvas element exists

    // Set initial canvas size (adjust as needed or make dynamic)
    const setCanvasSize = () => {
      const parent = canvas.parentElement; // Or set specific width/height
      if (parent) {
          canvas.width = parent.offsetWidth * 0.9; // e.g., 90% of parent width
          canvas.height = window.innerHeight * 0.6; // e.g., 60% of window height
      } else {
          canvas.width = window.innerWidth * 0.8;
          canvas.height = window.innerHeight * 0.6;
      }
    };

    setCanvasSize();

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round'; // Added for smoother corners
    contextRef.current = context;

    // Handle window resizing
    const handleResize = () => {
        // Store current drawing temporarily if needed before resize
        const currentImageData = context.getImageData(0, 0, canvas.width, canvas.height);
        setCanvasSize();
        // Restore or redraw after resize (redrawing allStrokes is simpler)
        context.putImageData(currentImageData, 0, 0); // Basic attempt to restore
        redrawAllStrokes(context, allStrokes, strokeColor, strokeWidth); // Redraw based on state
    };

    window.addEventListener('resize', handleResize);

    // Initial redraw of any existing strokes (important if component re-renders)
    redrawAllStrokes(context, allStrokes, strokeColor, strokeWidth);


    return () => {
        window.removeEventListener('resize', handleResize); // Cleanup listener
    };
     // Dependencies: allStrokes, strokeColor, strokeWidth because redraw depends on these
     // Adding contextRef is technically correct but usually context doesn't change
  }, [allStrokes, strokeColor, strokeWidth]); // Re-run effect if these dependencies change



  // Helper function to redraw all strokes
  const redrawAllStrokes = (context, strokes, color, width) => {
    if (!context) return;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clear canvas before redraw
    context.strokeStyle = color; // Set drawing color
    context.lineWidth = width; // Set line width

    strokes.forEach(stroke => {
        if (stroke.length < 2) return; // Need at least 2 points to draw a line

        context.beginPath();
        context.moveTo(stroke[0][0], stroke[0][1]); // Move to the first point

        // Draw line segments
        for (let i = 1; i < stroke.length; i++) {
            context.lineTo(stroke[i][0], stroke[i][1]);
        }
        context.stroke(); // Render the stroke
    });
};




  // Start a stroke
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    setCurrentPath([[offsetX, offsetY]]); // Start storing points for the current action (draw or erase)

    if (tool === 'freehand') {
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        contextRef.current.strokeStyle = strokeColor; // Apply current stroke color
        contextRef.current.lineWidth = strokeWidth; // Apply current stroke width
    }
    // Eraser doesn't draw on canvas in the same way immediately, just captures path
  };

  // Continue drawing
  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;

    if (tool === 'freehand') {
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    } else if (tool === 'eraser') {
         // Optional: Draw a visual indicator for the eraser (e.g., a circle)
         // This is more advanced; for now, just capture the path points
    }

    setCurrentPath(prevPath => [...prevPath, [offsetX, offsetY]]); // Add point to current path (for both tools)
  };

  // End a stroke and store it
  const stopDrawing = () => {
    if (!isDrawing) return; // Prevent multiple calls
    setIsDrawing(false);

    if (tool === 'freehand' && currentPath.length > 1) {
      // Add the finished freehand stroke to our collection
      setAllStrokes(prevStrokes => [...prevStrokes, currentPath]);
       // The useEffect watching allStrokes will handle the redraw
    } else if (tool === 'eraser' && currentPath.length > 1) {
      // Process the collected eraser path against existing strokes
      handleErase(currentPath);
      // The useEffect watching allStrokes (updated by handleErase) handles redraw
    }

    // No matter the tool, the current action path is finished
    setCurrentPath([]); // Reset current path for the next action
  };

  const handleErase = (eraserPath) => {
    if (eraserPath.length === 0) return;

    // Simple point-based proximity erasing
    const eraserRadius = 15; // Radius around eraser points to remove drawing points
    const newStrokes = [];

    allStrokes.forEach(stroke => {
        const pointsToKeep = [];
        // Iterate through each point in the existing stroke
        stroke.forEach(point => {
            let keepPoint = true;
            // Check if this point is "close" to *any* point in the eraser path
            for (const eraserPoint of eraserPath) {
                const dx = point[0] - eraserPoint[0];
                const dy = point[1] - eraserPoint[1];
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < eraserRadius) {
                    keepPoint = false;
                    break; // Point is close to the eraser, no need to check other eraser points
                }
            }

            if (keepPoint) {
                pointsToKeep.push(point);
            } else {
                 // Point is being erased. If we were previously adding points,
                 // this indicates a potential split in the stroke.
                 // For this simplified Phase 2, we just drop the point.
                 // A more advanced approach would detect contiguous segments
                 // in 'pointsToKeep' and add each segment as a new stroke.
            }
        });

        // Add remaining points as a new stroke if there are any.
        // Note: This simple approach doesn't handle splitting a stroke into two correctly.
        // It will create a single stroke with gaps. Implementing splitting
        // is a more complex geometric task for later refinement.
        if (pointsToKeep.length > 1) { // Need at least 2 points for a valid line segment/stroke
            newStrokes.push(pointsToKeep);
        }
        // If length is 0 or 1, the whole stroke (or remaining segment) is gone.
    });

    // Update the state with the modified list of strokes
    setAllStrokes(newStrokes);
    // The useEffect watching allStrokes will trigger the redraw.
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
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        style={{ border: '1px solid black' }}
        {...props} // Allow external styles or props
      />
     
  );
});

export default DrawingCanvas;
