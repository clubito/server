import { JWT_SECRET } from "@secrets";
import { Request, Response } from "express";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";
import jwt from "jsonwebtoken";

const registerSchema = joi.object().keys({
    email: joi.string().email().regex(/@purdue.edu$/i).required(),
    password: joi.string().min(6).regex(/\d/).required()
});

const loginSchema = joi.object().keys({
    email: joi.string().required(),
    password: joi.string().required()
});

export const postLogin = (req: Request, res: Response) : void => {
    const {error} = registerSchema.validate(req.body);

    if (error) {
        res.status(400).json({"error": error.message});
        return;
    }

    const {email, password} = req.body;

    User.findOne({"email": email}).exec((err, user) => {
        if (err) {
            res.status(500).json({"error": "Error authenticating user: " + err});
            return;
        } else if (!user) {
            res.status(400).json({"error": "Invalid username/password"});
            return;
        }

        user.validatePassword(password).then(result => {
            if (!result) {
                res.status(400).json({"error" : "Invalid username/password"});
                return;
            }

            const token = jwt.sign({
                user_id: user._id,
                email: user.email
            }, JWT_SECRET);

            res.status(200).json({
                "message": "Successfully authenticated",
                token
            });
            return;
        });
    });
};

export const postRegister = (req: Request, res: Response) : void => {
    const {error} = registerSchema.validate(req.body);

    if (error) {
        res.status(400).json({"error": error.message});
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