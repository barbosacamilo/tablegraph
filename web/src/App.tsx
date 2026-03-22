import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";

import type { DatabaseInfo, TableNodeType } from "./types";

import { TableNode } from "./components/TableNode";

function makeTableId(schema: string, table: string): string {
  return `${schema}.${table}`;
}

const nodeTypes: NodeTypes = {
  table: TableNode,
};

export default function App() {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDatabaseInfo(): Promise<void> {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/db-info");

        if (!response.ok) {
          throw new Error(`Failed to fetch db info: ${response.status}`);
        }

        const data = (await response.json()) as DatabaseInfo;
        setDbInfo(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load database info",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadDatabaseInfo();
  }, []);

  const initialNodes = useMemo<TableNodeType[]>(() => {
    if (!dbInfo) return [];

    return dbInfo.tables.map((table, index) => ({
      id: makeTableId(table.schema, table.name),
      type: "table",
      position: {
        x: (index % 4) * 360,
        y: Math.floor(index / 4) * 260,
      },
      data: { table },
    }));
  }, [dbInfo]);

  const initialEdges = useMemo<Edge[]>(() => {
    if (!dbInfo) return [];

    return dbInfo.relations.map((relation, index) => ({
      id: `${relation.name}-${index}`,
      source: makeTableId(relation.fromSchema, relation.fromTable),
      target: makeTableId(relation.toSchema, relation.toTable),
      label: `${relation.fromColumn} → ${relation.toColumn}`,
    }));
  }, [dbInfo]);

  const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  if (isLoading) {
    return <div style={{ padding: 16 }}>Loading database graph...</div>;
  }

  if (error) {
    return <div style={{ padding: 16 }}>Error: {error}</div>;
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}
