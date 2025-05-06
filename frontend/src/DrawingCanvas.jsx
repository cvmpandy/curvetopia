import React, { useRef, useEffect, useState ,forwardRef, useImperativeHandle } from 'react';

// forwardRef to allow parent component (App.js) to get a ref to this component's DOM node or exposed methods
const DrawingCanvas = forwardRef(({tool ,strokeColor = 'black', strokeWidth = 2, onDrawingComplete , className, ...props},ref) => {
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
        if(context){
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
        
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


//mouse event handler

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

    if (tool === 'freehand' ) {
        contextRef.current.closePath();
        if(currentPath.length > 1){
      // Add the finished freehand stroke to our collection
      setAllStrokes(prevStrokes => [...prevStrokes, currentPath]);
       // The useEffect watching allStrokes will handle the redraw
        }
    } else if (tool === 'eraser' && currentPath.length > 1) {
      // Process the collected eraser path against existing strokes
      handleErase(currentPath);
      // The useEffect watching allStrokes (updated by handleErase) handles redraw
    }

    // No matter the tool, the current action path is finished
    setCurrentPath([]); // Reset current path for the next action
  };

  const handleErase = (eraserPath) => {
    if (eraserPath.length < 2) return; // Need at least 2 points for an eraser stroke

    const eraserRadius = 15; // Radius around eraser points to remove drawing points
    const newStrokes = []; // This will collect all the segments that survive erasing

    // Iterate through each existing stroke
    allStrokes.forEach(stroke => {
        if (stroke.length < 2) {
            // Handle single points or 2-point lines which cannot be 'split' geometrically
            // Check if this short stroke is entirely within eraser radius
            let completelyErased = true;
            for(const point of stroke) {
                 let isKept = true;
                 for (const eraserPoint of eraserPath) {
                    const dx = point[0] - eraserPoint[0];
                    const dy = point[1] - eraserPoint[1];
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < eraserRadius) {
                        isKept = false;
                        break; // Found an eraser point nearby, this stroke point is "erased"
                    }
                }
                if (isKept) {
                    completelyErased = false; // Found a point that was NOT erased
                    break; // No need to check further points in this short stroke
                }
            }
             if (!completelyErased) {
                 newStrokes.push(stroke); // If not completely erased, keep the original (short) stroke
             }
             return; // Move to the next original stroke
        }

        // For strokes with 2 or more points, determine which points survive
        const isPointKept = stroke.map(point => {
            let kept = true; // Assume point is kept unless proven otherwise
            for (const eraserPoint of eraserPath) {
                const dx = point[0] - eraserPoint[0];
                const dy = point[1] - eraserPoint[1];
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < eraserRadius) {
                    kept = false; // This point is close enough to the eraser path to be removed
                    break; // No need to check against other eraser points for this stroke point
                }
            }
            return kept; // Return true if the point was not close to any eraser point
        });

        // Now, find contiguous sequences of 'true' in the isPointKept array.
        // Each contiguous sequence represents a segment of the original stroke that survived.
        let currentSegmentStart = -1; // Use -1 to indicate not currently inside a segment

        for (let i = 0; i < isPointKept.length; i++) {
            if (isPointKept[i] && currentSegmentStart === -1) {
                // Found the start of a new potential segment (current point is kept, previous was not or it's the first point)
                currentSegmentStart = i;
            } else if (!isPointKept[i] && currentSegmentStart !== -1) {
                // Found the end of a segment (current point is erased, but we were just in a segment)
                // Extract the segment points from the original stroke using the start and end indices
                const segment = stroke.slice(currentSegmentStart, i); // slice(start, end) extracts up to but not including end index
                // Only add valid line segments (need at least 2 points)
                if (segment.length >= 2) {
                    newStrokes.push(segment); // Add this valid segment as a new stroke
                }
                currentSegmentStart = -1; // Reset segment start marker
            }
            // If isPointKept[i] is true AND currentSegmentStart is NOT -1, we continue the current segment.
            // If isPointKept[i] is false AND currentSegmentStart is -1, we are in an erased gap, do nothing.
        }

        // After the loop, check if the stroke ended with a segment that hasn't been added yet
        if (currentSegmentStart !== -1) {
             // The segment runs from currentSegmentStart to the end of the stroke
             const segment = stroke.slice(currentSegmentStart, isPointKept.length); // slice to the end
             if (segment.length >= 2) {
                 newStrokes.push(segment); // Add the final segment if valid
             }
        }
    });

    // Update the state with the completely new list of strokes (including split segments)
    setAllStrokes(newStrokes);
     // The useEffect watching allStrokes state will automatically trigger a full redraw
     // of the canvas based on the updated state.
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
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%'}}>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        style={{ border: '1px solid black' }}
        {...props} // Allow external styles or props
      />
     </div>
  );
});

export default DrawingCanvas;
