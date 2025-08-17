import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT verification failed:", error);
        return res.status(400).json({ message: "Invalid token" });
    }
};