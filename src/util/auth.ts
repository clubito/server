import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "@secrets";
import jwt from "jsonwebtoken";
import { IJWTInterface } from "@models/Interfaces/IJWTInterface";
import User from "@models/User";


const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
        return res.status(403).json({ error: "No bearer token" });
    }
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7, authHeader.length);
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as IJWTInterface;

            User.findById(decoded.user_id).then(user => {
                if (user?.isDisabled) {
                    // User has deleted their account
                    res.status(401).json({ message: "Unauthorized" });
                    return;
                }
                // Token is valid and user exists
                req.userId = decoded.user_id;
                next();
            });
        } catch (e) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
    } else {
        res.status(400).json({ message: "No bearer token" });
        return;
    }
};

export { authenticateJWT };