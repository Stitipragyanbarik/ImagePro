class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const errorMiddleware = (error, _req, res, _next) => {
    error.message = error.message || "Internal server error";
    error.statusCode = error.statusCode || 500;

    return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        ...(process.env.NODE_ENV === "development" && { error: error.stack })
    });
};

export default ErrorHandler;