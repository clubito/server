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
    extractUserIdFromToken(authHeader)
        .then(userId => {
            req.userId = userId;
            next();
        })
        .catch(err => {
            res.status(400).json({ message: err });
            return;
        });
};

const extractUserIdFromToken = async (bearerToken: string): Promise<string> => {
    if (bearerToken.startsWith("Bearer ")) {
        const token = bearerToken.substring(7, bearerToken.length);
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as IJWTInterface;
            const user = await User.findById(decoded.user_id).exec();
            if (!user) {
                return Promise.reject("User does not exist");
            }

            if (user.isDisabled) {
                // User has deleted their account
                return Promise.reject("Unauthorized");
            }

            if (user.banned) {
                // user is banned, don't let them proceed
                return Promise.reject("User is banned");
            }

            // Token is valid and user exists
            return Promise.resolve(decoded.user_id);
        } catch (e) {
            return Promise.reject("Unauthorized");
        }
    } else {
        return Promise.reject("No bearer token");
    }
};

export { authenticateJWT };