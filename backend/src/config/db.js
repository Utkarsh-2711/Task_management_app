// This module creates the MySQL pool and initializes the database from the shared schema file.
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import "dotenv/config";

const databaseConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
};

const pool = mysql.createPool({
    ...databaseConfig,
    database: process.env.DB_NAME,
    // Keep MySQL DATE values as YYYY-MM-DD strings for HTML date inputs and API responses.
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export async function initializeDatabase() {
    // Run the repository schema before creating the application pool so a fresh setup works automatically.
    const connection = await mysql.createConnection({
        ...databaseConfig,
        multipleStatements: true,
    });
    const currentFile = fileURLToPath(import.meta.url);
    const schemaPath = resolve(
        dirname(currentFile),
        "../../../database/schema.sql",
    );
    const schema = await readFile(schemaPath, "utf8");

    try {
        await connection.query(schema);
    } finally {
        await connection.end();
    }
}

export async function checkDatabaseConnection() {
    // Borrow one connection to verify that the configured database is reachable.
    const connection = await pool.getConnection();
    try {
        await connection.ping();
    } finally {
        connection.release();
    }
}

export default pool;
