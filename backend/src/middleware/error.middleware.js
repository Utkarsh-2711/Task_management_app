// Central API error handler: keeps database and server failures consistent and safe for clients.
function getDatabaseError(error) {
    const databaseErrors = {
        ECONNREFUSED: {
            status: 503,
            message: "MySQL server is unavailable. Make sure MySQL is running.",
        },
        ER_ACCESS_DENIED_ERROR: {
            status: 503,
            message:
                "MySQL authentication failed. Check DB_USER and DB_PASSWORD.",
        },
        ER_BAD_DB_ERROR: {
            status: 503,
            message:
                "MySQL database is unavailable. Check DB_NAME or run the schema setup.",
        },
        ER_NO_SUCH_TABLE: {
            status: 503,
            message:
                "Database tables are missing. Run the database schema setup.",
        },
        ER_DUP_ENTRY: {
            status: 409,
            message: "This record already exists.",
        },
        ER_NO_REFERENCED_ROW_2: {
            status: 400,
            message: "The referenced project does not exist.",
        },
        ER_TRUNCATED_WRONG_VALUE: {
            status: 400,
            message: "One of the submitted values has an invalid format.",
        },
        ER_DATA_TOO_LONG: {
            status: 400,
            message: "One of the submitted values is too long.",
        },
        ER_BAD_NULL_ERROR: {
            status: 400,
            message: "A required field is missing.",
        },
    };

    return databaseErrors[error.code] || null;
}

export function getStartupErrorMessage(error) {
    return (
        getDatabaseError(error)?.message ||
        "Backend could not connect to MySQL."
    );
}

export function errorMiddleware(error, _request, response, next) {
    // Let Express close the connection if a response was already partially sent.
    if (response.headersSent) {
        return next(error);
    }

    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        "body" in error
    ) {
        return response.status(400).json({
            success: false,
            message: "Request body must contain valid JSON.",
        });
    }

    if (error.type === "entity.too.large") {
        return response.status(413).json({
            success: false,
            message: "Request body is too large.",
        });
    }

    if (error.type === "encoding.unsupported") {
        return response.status(415).json({
            success: false,
            message: "Request encoding is not supported.",
        });
    }

    const databaseError = getDatabaseError(error);
    if (databaseError) {
        console.error("Database error:", error.code);
        return response.status(databaseError.status).json({
            success: false,
            message: databaseError.message,
        });
    }

    console.error("Unhandled server error:", error);
    return response.status(500).json({
        success: false,
        message: "Internal server error. Please try again later.",
    });
}
