import React, { useRef, useState } from "react";
import { Stage, Layer, Rect, Line, Text, Circle, Group } from "react-konva";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

// Types
const SHAPE_TYPES = {
  WALL: "wall",
  DOOR: "door",
  RECT: "rect",
  CIRCLE: "circle",
};

function genId(type: string): string {
  return `${type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

interface WallShape { id: string; type: 'wall'; points: number[]; stroke: string; }
interface DoorShape { id: string; type: 'door'; x: number; y: number; width: number; height: number; fill: string; label: string; }
interface RectShape { id: string; type: 'rect'; x: number; y: number; width: number; height: number; fill: string; label: string; }
interface CircleShape { id: string; type: 'circle'; x: number; y: number; radius: number; fill: string; label: string; }
type Shape = WallShape | DoorShape | RectShape | CircleShape;

export default function KonvaFloormapEditor() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>("");

  // Add shape
  const addShape = (type: string) => {
    let newShape: Shape | undefined;
    if (type === SHAPE_TYPES.WALL) {
      newShape = { id: genId(type), type: 'wall', points: [120, 120, 220, 120], stroke: "#333" };
    } else if (type === SHAPE_TYPES.DOOR) {
      newShape = { id: genId(type), type: 'door', x: 200, y: 200, width: 40, height: 12, fill: "brown", label: "Door" };
    } else if (type === SHAPE_TYPES.RECT) {
      newShape = { id: genId(type), type: 'rect', x: 250, y: 250, width: 60, height: 40, fill: "orange", label: "Furniture" };
    } else if (type === SHAPE_TYPES.CIRCLE) {
      newShape = { id: genId(type), type: 'circle', x: 300, y: 300, radius: 18, fill: "gray", label: "Chair" };
    }
    if (newShape) {
      setShapes((prev) => [...prev, newShape!]);
      setSelectedId(newShape.id);
      setEditingLabel((newShape as any).label || "");
    }
  };

  // Delete shape
  const deleteSelected = () => {
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
    setEditingLabel("");
  };

  // Drag logic for rect/door/circle
  const handleDrag = (id: string, pos: { x: number; y: number }) => {
    setShapes((prev) => prev.map((s) => {
      if (s.id === id) {
        if (s.type === SHAPE_TYPES.CIRCLE) {
          return { ...s, x: pos.x, y: pos.y } as CircleShape;
        } else if (s.type === SHAPE_TYPES.RECT || s.type === SHAPE_TYPES.DOOR) {
          return { ...s, x: pos.x, y: pos.y } as DoorShape | RectShape;
        }
      }
      return s;
    }));
  };

  // Drag logic for wall (whole line)
  const handleWallDrag = (id: string, dx: number, dy: number) => {
    setShapes((prev) => prev.map((s) => {
      if (s.id === id && s.type === SHAPE_TYPES.WALL) {
        const points = (s as WallShape).points;
        return { ...s, points: [points[0] + dx, points[1] + dy, points[2] + dx, points[3] + dy] } as WallShape;
      }
      return s;
    }));
  };

  // Drag wall endpoints
  const handleWallEndpointDrag = (id: string, idx: number, pos: { x: number; y: number }) => {
    setShapes((prev) => prev.map((s) => {
      if (s.id === id && s.type === SHAPE_TYPES.WALL) {
        const points = (s as WallShape).points;
        if (idx === 0) {
          return { ...s, points: [pos.x, pos.y, points[2], points[3]] } as WallShape;
        } else {
          return { ...s, points: [points[0], points[1], pos.x, pos.y] } as WallShape;
        }
      }
      return s;
    }));
  };

  // Resize logic for rect/door
  const handleRectResize = (id: string, pos: { x: number; y: number }) => {
    setShapes((prev) => prev.map((s) => {
      if (s.id === id && (s.type === SHAPE_TYPES.RECT || s.type === SHAPE_TYPES.DOOR)) {
        const x = (s as RectShape | DoorShape).x;
        const y = (s as RectShape | DoorShape).y;
        return { ...s, width: Math.max(20, pos.x - x), height: Math.max(10, pos.y - y) } as DoorShape | RectShape;
      }
      return s;
    }));
  };

  // Resize logic for circle
  const handleCircleResize = (id: string, pos: { x: number; y: number }) => {
    setShapes((prev) => prev.map((s) => {
      if (s.id === id && s.type === SHAPE_TYPES.CIRCLE) {
        const x = (s as CircleShape).x;
        const y = (s as CircleShape).y;
        return { ...s, radius: Math.max(8, Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2))) } as CircleShape;
      }
      return s;
    }));
  };

  // Label editing
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingLabel(e.target.value);
    setShapes((prev) => prev.map((s) =>
      s.id === selectedId && (s.type === SHAPE_TYPES.RECT || s.type === SHAPE_TYPES.DOOR || s.type === SHAPE_TYPES.CIRCLE)
        ? { ...s, label: e.target.value } as DoorShape | RectShape | CircleShape
        : s
    ));
  };

  // Highlight
  const highlight = (shape: Shape) => selectedId === shape.id ? { shadowColor: "#0070f3", shadowBlur: 10 } : {};

  // Export shapes as JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shapes, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "floormap.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Import shapes from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedShapes = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedShapes)) {
          setShapes(importedShapes);
          setSelectedId(null);
          setEditingLabel("");
        } else {
          alert("Invalid file format: expected an array.");
        }
      } catch {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be imported again if needed
    e.target.value = "";
  };

  return (
    <div>
      <div className="mb-2 space-x-2">
        <button onClick={() => addShape(SHAPE_TYPES.RECT)} className="bg-blue-500 text-white px-3 py-1 rounded">Add Furniture</button>
        <button onClick={() => addShape(SHAPE_TYPES.CIRCLE)} className="bg-green-500 text-white px-3 py-1 rounded">Add Chair</button>
        <button onClick={() => addShape(SHAPE_TYPES.WALL)} className="bg-gray-700 text-white px-3 py-1 rounded">Add Wall</button>
        <button onClick={() => addShape(SHAPE_TYPES.DOOR)} className="bg-yellow-700 text-white px-3 py-1 rounded">Add Door</button>
        <button onClick={deleteSelected} disabled={!selectedId} className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50">Delete Selected</button>
        <button onClick={handleExportJSON} className="bg-purple-500 text-white px-3 py-1 rounded">Export as JSON</button>
        <label className="bg-indigo-500 text-white px-3 py-1 rounded cursor-pointer ml-2">
          Import JSON
          <input type="file" accept="application/json" onChange={handleImportJSON} style={{ display: 'none' }} />
        </label>
      </div>
      <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ border: "1px solid #ccc" }}>
        <Layer>
          {shapes.map((shape) => {
            if (shape.type === SHAPE_TYPES.WALL) {
              const points = (shape as WallShape).points;
              const [x1, y1, x2, y2] = points;
              const stroke = (shape as WallShape).stroke;
              return (
                <Group key={shape.id}>
                  {/* Wall line, draggable as a whole */}
                  <Line
                    points={points}
                    stroke={selectedId === shape.id ? "#0070f3" : stroke}
                    strokeWidth={5}
                    onClick={() => setSelectedId(shape.id)}
                    onTap={() => setSelectedId(shape.id)}
                    draggable
                    onDragMove={e => {
                      const dx = e.target.x() - x1;
                      const dy = e.target.y() - y1;
                      handleWallDrag(shape.id, dx, dy);
                      e.target.x(0); e.target.y(0); // reset group position
                    }}
                    {...highlight(shape)}
                  />
                  {/* Endpoints */}
                  {[0, 2].map((idx) => (
                    <Circle
                      key={idx}
                      x={points[idx]}
                      y={points[idx + 1]}
                      radius={10}
                      fill="#888"
                      opacity={selectedId === shape.id ? 0.5 : 0.2}
                      draggable
                      onDragMove={e => handleWallEndpointDrag(shape.id, idx / 2, { x: e.target.x(), y: e.target.y() })}
                      onMouseDown={e => e.cancelBubble = true}
                      onClick={e => { e.cancelBubble = true; setSelectedId(shape.id); }}
                      onTap={e => { e.cancelBubble = true; setSelectedId(shape.id); }}
                      cursor="pointer"
                    />
                  ))}
                </Group>
              );
            }
            if (shape.type === SHAPE_TYPES.RECT || shape.type === SHAPE_TYPES.DOOR) {
              const x = (shape as RectShape | DoorShape).x;
              const y = (shape as RectShape | DoorShape).y;
              const width = (shape as RectShape | DoorShape).width;
              const height = (shape as RectShape | DoorShape).height;
              const fill = (shape as RectShape | DoorShape).fill;
              const label = (shape as RectShape | DoorShape).label;
              return (
                <Group key={shape.id}>
                  {/* Large transparent hitbox for easy selection only */}
                  <Rect
                    x={x - 10}
                    y={y - 10}
                    width={width + 20}
                    height={height + 20}
                    fill="#000"
                    opacity={0.01}
                    listening={true}
                    onClick={() => setSelectedId(shape.id)}
                    onTap={() => setSelectedId(shape.id)}
                  />
                  <Rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fill}
                    stroke={selectedId === shape.id ? "#0070f3" : undefined}
                    strokeWidth={selectedId === shape.id ? 2 : 0}
                    draggable
                    onDragMove={e => handleDrag(shape.id, { x: e.target.x(), y: e.target.y() })}
                    onDragEnd={e => handleDrag(shape.id, { x: e.target.x(), y: e.target.y() })}
                    onClick={() => setSelectedId(shape.id)}
                    onTap={() => setSelectedId(shape.id)}
                    {...highlight(shape)}
                  />
                  {/* Label */}
                  {label && (
                    <Text
                      x={x}
                      y={y + height / 2 - 10}
                      width={width}
                      align="center"
                      text={label}
                      fontSize={16}
                      fill="#222"
                    />
                  )}
                  {/* Resize handle */}
                  {selectedId === shape.id && (
                    <Rect
                      x={x + width - 8}
                      y={y + height - 8}
                      width={16}
                      height={16}
                      fill="#888"
                      opacity={0.7}
                      draggable
                      onDragMove={e => handleRectResize(shape.id, { x: e.target.x(), y: e.target.y() })}
                      onDragEnd={e => handleRectResize(shape.id, { x: e.target.x(), y: e.target.y() })}
                      cursor="nwse-resize"
                      onMouseDown={e => e.cancelBubble = true}
                      onClick={e => e.cancelBubble = true}
                    />
                  )}
                </Group>
              );
            }
            if (shape.type === SHAPE_TYPES.CIRCLE) {
              const x = (shape as CircleShape).x;
              const y = (shape as CircleShape).y;
              const radius = (shape as CircleShape).radius;
              const fill = (shape as CircleShape).fill;
              const label = (shape as CircleShape).label;
              return (
                <Group key={shape.id}>
                  {/* Large transparent hitbox for easy selection only */}
                  <Circle
                    x={x}
                    y={y}
                    radius={radius + 14}
                    fill="#000"
                    opacity={0.01}
                    listening={true}
                    onClick={() => setSelectedId(shape.id)}
                    onTap={() => setSelectedId(shape.id)}
                  />
                  <Circle
                    x={x}
                    y={y}
                    radius={radius}
                    fill={fill}
                    stroke={selectedId === shape.id ? "#0070f3" : undefined}
                    strokeWidth={selectedId === shape.id ? 2 : 0}
                    draggable
                    onDragMove={e => handleDrag(shape.id, { x: e.target.x(), y: e.target.y() })}
                    onDragEnd={e => handleDrag(shape.id, { x: e.target.x(), y: e.target.y() })}
                    onClick={() => setSelectedId(shape.id)}
                    onTap={() => setSelectedId(shape.id)}
                    {...highlight(shape)}
                  />
                  {/* Label */}
                  {label && (
                    <Text
                      x={x - radius}
                      y={y - 10}
                      width={radius * 2}
                      align="center"
                      text={label}
                      fontSize={16}
                      fill="#222"
                    />
                  )}
                  {/* Resize handle */}
                  {selectedId === shape.id && (
                    <Circle
                      x={x + radius}
                      y={y}
                      radius={10}
                      fill="#888"
                      opacity={0.7}
                      draggable
                      onDragMove={e => handleCircleResize(shape.id, { x: e.target.x(), y: e.target.y() })}
                      onDragEnd={e => handleCircleResize(shape.id, { x: e.target.x(), y: e.target.y() })}
                      cursor="ew-resize"
                      onMouseDown={e => e.cancelBubble = true}
                      onClick={e => e.cancelBubble = true}
                    />
                  )}
                </Group>
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
      {/* Label editor */}
      {selectedId && shapes.find(s => s.id === selectedId && (s.type === SHAPE_TYPES.RECT || s.type === SHAPE_TYPES.DOOR || s.type === SHAPE_TYPES.CIRCLE)) && (
        <div className="mt-2">
          <label className="mr-2">Label:</label>
          <input
            type="text"
            value={editingLabel}
            onChange={handleLabelChange}
            className="border px-2 py-1 rounded"
            style={{ minWidth: 80 }}
          />
        </div>
      )}
    </div>
  );
}
