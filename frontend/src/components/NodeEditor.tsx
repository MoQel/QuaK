import { useState, useCallback } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    EdgeChange,
    NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
    {
        id: '1',
        data: {label: 'Component1'},
        position: {x: 0, y: 0},
        type: 'input',
    },
    {
        id: '2',
        data: {label: 'Component2'},
        position: {x: 100, y: 100},
    },
];

const initialEdges = [
    {id: '1-2', source: '1', target: '2', label: 'Hadamard', type: 'step'},
];

function NodeEditor() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

    const onNodesChange = useCallback(
        (changes: NodeChange<{ id: string; data: { label: string; }; position: { x: number; y: number; }; type: string; } | { id: string; data: { label: string; }; position: { x: number; y: number; }; type?: undefined; }>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [],
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange<{ id: string; source: string; target: string; label: string; type: string; }>[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [],
    );

    return (
        <div style={{ height: '100%' }}>
            <ReactFlow
                colorMode="dark"
                nodes={nodes}
                onNodesChange={onNodesChange}
                edges={edges}
                onEdgesChange={onEdgesChange}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}

export default NodeEditor;