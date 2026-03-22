import { Pool } from "pg";

export const supportedDriversList = ["postgres"] as const;

export type DatabaseDriver = (typeof supportedDriversList)[number];

interface TableQueryRow {
  table_schema: string;
  table_name: string;
  table_type: string;
}

interface ColumnQueryRow {
  table_schema: string;
  table_name: string;
  column_name: string;
  ordinal_position: number;
  udt_name: string;
}

interface ForeignKeyQueryRow {
  constraint_name: string;
  source_schema: string;
  source_table: string;
  source_column: string;
  target_schema: string;
  target_table: string;
  target_column: string;
}

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

async function getTables(pool: Pool): Promise<TableQueryRow[]> {
  const query = `
    SELECT
      table_schema,
      table_name,
      table_type
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      AND table_type = 'BASE TABLE'
    ORDER BY table_schema, table_name;
  `;

  const result = await pool.query<TableQueryRow>(query);
  return result.rows;
}

async function getColumns(pool: Pool): Promise<ColumnQueryRow[]> {
  const query = `
    SELECT
      table_schema,
      table_name,
      column_name,
      ordinal_position,
      udt_name
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name, ordinal_position;
  `;

  const result = await pool.query<ColumnQueryRow>(query);
  return result.rows;
}

async function getForeignKeys(pool: Pool): Promise<ForeignKeyQueryRow[]> {
  const query = `
    SELECT
      tc.constraint_name,
      tc.table_schema AS source_schema,
      tc.table_name AS source_table,
      kcu.column_name AS source_column,
      ccu.table_schema AS target_schema,
      ccu.table_name AS target_table,
      ccu.column_name AS target_column
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY
      source_schema,
      source_table,
      tc.constraint_name,
      source_column;
  `;

  const result = await pool.query<ForeignKeyQueryRow>(query);
  return result.rows;
}

function makeTableKey(schema: string, table: string): string {
  return `${schema}.${table}`;
}

export async function getDatabaseInfo(
  driver: DatabaseDriver,
  url: string,
): Promise<DatabaseInfo> {
  switch (driver) {
    case "postgres": {
      const pool = new Pool({ connectionString: url });

      try {
        const [allTables, allColumns, allForeignKeys] = await Promise.all([
          getTables(pool),
          getColumns(pool),
          getForeignKeys(pool),
        ]);

        const columnsByTable = new Map<string, Column[]>();

        for (const column of allColumns) {
          const key = makeTableKey(column.table_schema, column.table_name);

          const current = columnsByTable.get(key) ?? [];
          current.push({
            name: column.column_name,
            position: Number(column.ordinal_position),
            type: column.udt_name,
          });

          columnsByTable.set(key, current);
        }

        const tables: Table[] = allTables.map((table) => {
          const key = makeTableKey(table.table_schema, table.table_name);

          return {
            schema: table.table_schema,
            name: table.table_name,
            columns: columnsByTable.get(key) ?? [],
          };
        });

        const relations: Relation[] = allForeignKeys.map((fk) => ({
          name: fk.constraint_name,
          fromSchema: fk.source_schema,
          fromTable: fk.source_table,
          fromColumn: fk.source_column,
          toSchema: fk.target_schema,
          toTable: fk.target_table,
          toColumn: fk.target_column,
        }));

        return { tables, relations };
      } finally {
        await pool.end();
      }
    }
  }
}
