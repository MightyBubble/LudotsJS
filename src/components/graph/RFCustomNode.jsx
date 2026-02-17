import React, { memo, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getTypeColor } from './nodeConfigs';

/**
 * React Flow custom node wrapper.
 * Renders the original Node/QueryNode/DataTableNode components inside,
 * and adds React Flow Handles for connection.
 */
function RFCustomNode({ data, selected }) {
  const node = data; // The original node object is stored in data
  const NodeComponent = data.NodeComponent;

  // Build connectedInputPorts set from the data
  const connectedInputPorts = data.connectedInputPorts || new Set();

  // We need a "fake" set of callbacks that don't do the old manual connection logic
  // since React Flow handles connections natively via Handles.
  const noopConnection = () => {};

  const nodeForRender = useMemo(() => ({
    ...node,
    connectedValues: data.connectionValues
      ? Object.fromEntries(
          Object.entries(data.connectionValues).filter(([key]) => key.startsWith(node.id))
        )
      : {},
  }), [node, data.connectionValues]);

  // Collect all input/output ports for Handle rendering
  const inputPorts = node.inputs || [];
  const outputPorts = node.outputs || [];

  return (
    <div className="relative" style={{ minWidth: 220 }}>
      {/* Input Handles */}
      {inputPorts.map((port, idx) => (
        <Handle
          key={`input-${port.id}`}
          type="target"
          position={Position.Left}
          id={`input-${port.id}`}
          style={{
            top: `${((idx + 1) / (inputPorts.length + 1)) * 100}%`,
            background: getTypeColor(port.type),
            width: 10,
            height: 10,
            border: '2px solid #1a1a1a',
            zIndex: 10,
          }}
        />
      ))}

      {/* Render the original node component */}
      {NodeComponent ? (
        <NodeComponent
          node={nodeForRender}
          selected={selected}
          connectedInputPorts={connectedInputPorts}
          onUpdatePosition={() => {}} // React Flow handles position
          onUpdateData={data.onUpdateData || (() => {})}
          onDelete={data.onDelete || (() => {})}
          onSelect={() => {}} // React Flow handles selection
          onStartConnection={noopConnection}
          onEndConnection={noopConnection}
        />
      ) : null}

      {/* Output Handles */}
      {outputPorts.map((port, idx) => (
        <Handle
          key={`output-${port.id}`}
          type="source"
          position={Position.Right}
          id={`output-${port.id}`}
          style={{
            top: `${((idx + 1) / (outputPorts.length + 1)) * 100}%`,
            background: getTypeColor(port.type),
            width: 10,
            height: 10,
            border: '2px solid #1a1a1a',
            zIndex: 10,
          }}
        />
      ))}
    </div>
  );
}

export default memo(RFCustomNode);