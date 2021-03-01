import { Request, Response } from "express";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";

const registerSchema = joi.object().keys({
    email: joi.string().email().required(),
    password: joi.string().min(6).regex(/\d/).required()
});

export const postLogin = (req: Request, res: Response) : void => {
    const {email, password} = req.body;
    // Note: don't validate username and password here, only at register

    res.json({
        email,
        password
    });
    return;
};

export const postRegister = (req: Request, res: Response) : void => {
    const {error, value} = registerSchema.validate(req.body);

    if (error) {
        res.status(400).json({"error": "Email/password is not valid"});
        console.log(error);
        return;
    }
    
    const {email, password} = req.body;
    
    const newUser = new User({
        email,
        password
    });

    newUser.save((err: any, user) => {
        if (err || !user) {
            if (err.code == 11000) {
                res.status(400).json({"error": "Email already exists"});
                logger.debug({"error": "Tried adding user with existing email", email});
            } else {
                res.status(400).json({"error": "Error adding user: " + err?.message});
                logger.error(err?.message || `Cannot add user with email: ${email}`);
            }
            return;
            
        }
        res.status(200).json({
            "message": "Successfully added user",
            "user_id": user["_id"]
        });
        return;
    });
};