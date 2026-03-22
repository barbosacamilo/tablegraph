#!/usr/bin/env node

import {
  getDatabaseInfo,
  supportedDriversList,
  type DatabaseDriver,
} from "../core/index.js";
import { startServer } from "../server/index.js";

const cliFlags = ["--driver", "--url", "--help"] as const;
type CliFlag = (typeof cliFlags)[number];

const cliFlagsSet = new Set(cliFlags);
const supportedDriversSet = new Set(supportedDriversList);

interface CliOptions {
  driver?: DatabaseDriver;
  url?: string;
}

interface ValidatedCliOptions {
  driver: DatabaseDriver;
  url: string;
}

function invalidUrl(value: string): boolean {
  try {
    new URL(value);
    return false;
  } catch {
    return true;
  }
}

function printHelp(): void {
  console.log(
    `
Usage:
  tablegraph [options]

Options:
  --driver <postgres>
  --url <connection-url>
  --help

Examples:
  tablegraph --driver postgres --url postgresql://username:password@localhost:5432/db_name
`.trim(),
  );
}

function parseArgs(args: string[]): ValidatedCliOptions {
  const options: CliOptions = {};

  if (args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  if (args.length === 0) {
    printHelp();
    process.exit(1);
  }

  if (args.length % 2 !== 0) {
    throw new Error("Flags must be provided as pairs: --flag value.");
  }

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    if (!cliFlagsSet.has(flag as CliFlag)) {
      throw new Error(
        `Unsupported flag "${flag}". Valid flags: ${cliFlags.join(", ")}.`,
      );
    }

    if (flag === "--help") {
      continue;
    }

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for flag "${flag}".`);
    }

    if (flag === "--driver") {
      if (!supportedDriversSet.has(value as DatabaseDriver)) {
        throw new Error(
          `Unsupported driver "${value}". Valid drivers: ${supportedDriversList.join(", ")}.`,
        );
      }

      options.driver = value as DatabaseDriver;
      continue;
    }

    if (flag === "--url") {
      if (invalidUrl(value)) {
        throw new Error(`Invalid URL "${value}".`);
      }

      options.url = value;
    }
  }

  if (!options.driver) {
    throw new Error('Missing required flag "--driver".');
  }

  if (!options.url) {
    throw new Error('Missing required flag "--url".');
  }

  return {
    driver: options.driver,
    url: options.url,
  };
}

async function main(): Promise<void> {
  const argList = process.argv.slice(2);
  const options = parseArgs(argList);

  const dbInfo = await getDatabaseInfo(options.driver, options.url);

  if (dbInfo.tables.length === 0) {
    console.warn(
      [
        "Warning: no tables were found in the database.",
        "Make sure you are connecting to the correct database and that your schema has already been initialized.",
      ].join("\n"),
    );
  }

  await startServer(dbInfo);
}

main().catch((error: unknown) => {
  const isDev = process.env.NODE_ENV === "development";

  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);

    if (isDev) {
      console.error(error.stack);
    }

    process.exit(1);
  }

  console.error("An unexpected error occurred.");

  if (isDev) {
    console.error(error);
  }

  process.exit(1);
});
