# TableGraph

Visualize your database schema as an interactive graph directly in your browser.

<p>
  <img src="https://raw.githubusercontent.com/barbosacamilo/tablegraph/main/assets/logo.png" alt="TableGraph logo" width="250" />
</p>

## What it does

TableGraph connects to your database, reads schema metadata, and opens a local web interface where you can inspect tables, columns, and relationships visually.

## Install

### Global install

```bash
npm install -g tablegraph
```

### Or run with npx

```bash
npx tablegraph --driver postgres --url <connection-url>
```

## Usage

```bash
tablegraph --driver postgres --url postgresql://username:password@localhost:5432/db_name
```

Then open:

```txt
http://localhost:3001
```

## Example

```bash
tablegraph --driver postgres --url postgresql://postgres:postgres@localhost:5434/postgres
```

## Visualization

<p align="center">
  <img src="https://raw.githubusercontent.com/barbosacamilo/tablegraph/main/assets/example.png" alt="TableGraph web visualization" />
</p>

## Supported drivers

- postgres

## Notes

- Make sure your database is running and accessible
- Ensure your schema is initialized and contains tables
- TableGraph runs locally and serves the visualization in your browser
