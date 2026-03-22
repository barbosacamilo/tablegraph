import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { TableNodeType } from "../types";

export function TableNode({ data }: NodeProps<TableNodeType>) {
  const { table } = data;

  return (
    <div
      style={{
        minWidth: 240,
        border: "1px solid #222",
        borderRadius: 8,
        background: "#fff",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
        fontSize: 12,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid #ddd",
          fontWeight: 600,
          background: "#f7f7f7",
        }}
      >
        <div>{table.name}</div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
          {table.schema}
        </div>
      </div>

      <div>
        {table.columns.map((column) => (
          <div
            key={column.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: "8px 12px",
              borderTop: "1px solid #f1f1f1",
            }}
          >
            <span>{column.name}</span>
            <span style={{ color: "#666" }}>{column.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
