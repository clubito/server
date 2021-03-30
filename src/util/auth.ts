import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "@secrets";
import jwt from "jsonwebtoken";
import { IJWTInterface } from "@models/Interfaces/IJWTInterface";
import User from "@models/User";


const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.headers.authorization) {
        res.status(403).json({ error: "No bearer token" });
        return;
    }
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7, authHeader.length);
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as IJWTInterface;

            User.findById(decoded.user_id).then(user => {
                if (!user) {
                    res.status(400).json({ message: "User does not exist" });
                    return;
                }

                if (user.isDisabled) {
                    // User has deleted their account
                    res.status(401).json({ message: "Unauthorized" });
                    return;
                }

                if (user.banned) {
                    // user is banned, don't let them proceed
                    res.status(401).json({ message: "User is banned" });
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
        return next(err);
    }
};

export { authenticateJWT };