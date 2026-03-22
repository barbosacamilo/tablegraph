import type { Node } from "@xyflow/react";

interface Column {
  name: string;
  position: number;
  type: string;
}

interface Table {
  schema: string;
  name: string;
  columns: Column[];
}

interface Relation {
  name: string;
  fromSchema: string;
  fromTable: string;
  fromColumn: string;
  toSchema: string;
  toTable: string;
  toColumn: string;
}

export interface DatabaseInfo {
  tables: Table[];
  relations: Relation[];
}

type TableNodeData = Record<string, unknown> & {
  table: Table;
};

export type TableNodeType = Node<TableNodeData, "table">;
