import { NextFunction, Request, Response } from "express";
import joi from "joi";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@secrets";
import { IJWTInterface } from "@models/Interfaces/IJWTInterface";
import User from "@models/User";



const verifyTokenSchema = joi.object().keys({
    token: joi.string().required()
});

export const postTokenVerify = (req: Request, res: Response, next: NextFunction): void => {
    const { error } = verifyTokenSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        return;
    }

    const { token } = req.body;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as IJWTInterface;

        User.findById(decoded.user_id).then(user => {
            if (user?.isDisabled) {
                // User has deleted their account
                res.status(400).json({ message: "Invalid token" });
                return;
            }
        });

        res.status(200).json({ message: "Valid token" });
        return;
    } catch (e) {
        return next(e);
    }
};