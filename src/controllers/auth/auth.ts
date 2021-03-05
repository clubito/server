import { JWT_SECRET } from "@secrets";
import { Request, Response } from "express";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";
import jwt from "jsonwebtoken";
import { sendingVerifyEmail } from "../../util/mail";

const registerSchema = joi.object().keys({
    // email: joi.string().email().regex(/@purdue.edu$/i).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).regex(/\d/).required()
});

const loginSchema = joi.object().keys({
    email: joi.string().required(),
    password: joi.string().required()
});

export const postLogin = (req: Request, res: Response): void => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const { email, password } = req.body;

    User.findOne({ "email": email }).exec((err, user) => {
        if (err) {
            res.status(500).json({ "error": "Error authenticating user: " + err });
            logger.debug(err);
            return;
        } else if (!user) {
            res.status(400).json({ "error": "Invalid username/password" });
            return;
        }

        if (!user.isConfirmed) {
            res.status(400).json({ "error": "Please confirm your account before trying to log in" });
            return;
        }

        user.validatePassword(password).then(result => {
            if (!result) {
                res.status(400).json({ "error": "Invalid username/password" });
                logger.debug("Attempted login with invalid username/password");

                return;
            }

            const token = jwt.sign({
                user_id: user._id,
                email: user.email
            }, JWT_SECRET);

            res.status(200).json({
                "message": "Successfully authenticated",
                token,
                "isProfileSetup": user.name.length > 0,
            });
            logger.debug("Successfully authenticated", token);
            return;
        });
    });
};

export const postRegister = (req: Request, res: Response): void => {
    const { error } = registerSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        return;
    }

    const { email, password } = req.body;

    const newUser = new User({
        email,
        password
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newUser.save((err: any, user) => {
        if (err || !user) {
            if (err.code == 11000) {
                res.status(400).json({ "error": "Email already exists" });
                logger.debug({ "error": "Tried adding user with existing email", email });
            } else {
                res.status(400).json({ "error": "Error adding user: " + err?.message });
                logger.error(err?.message || `Cannot add user with email: ${email}`);
            }
            return;

        }
        res.status(200).json({
            "message": "Successfully added user",
            "user_id": user["_id"]
        });

        sendingVerifyEmail(user.email, user.secret);
        return;
    });
};

export const postReset = (req: Request, res: Response): void => {
    if (!req.userId) {
        res.status(500).json({
            message: "UserId not found. Please log in first"
        });
        return;
    }
    if (!req.body.currentPassword || !req.body.newPassword) {
        res.status(400).json({
            message: "Missing current and new password fields"
        });
        return;
    }
    if (req.body.currentPassword == req.body.newPassword) {
        res.status(400).json({
            message: "Please choose a new password different than the current one"
        });
        return;
    }

    const userId: string = req.userId;
    const currentPassword: string = req.body.currentPassword;
    const newPassword: string = req.body.newPassword;

    //get user id from request
    User.findById(userId).then(user => {
        logger.debug(`User: ${user}`);
        logger.debug(`CurrentPass: ${currentPassword}`);
        logger.debug(`NewPass: ${newPassword}`);
        //check if old password the same as the one already stored in db
        user?.validatePassword(currentPassword).then(result => {
            if (!result) {
                res.status(400).json({ "error": "Current password field is wrong" });
                logger.debug("currentPassword field is not the same as current password");
                return;
            }

            //change current password to new and save it back to db
            user.password = newPassword;
            user.save();
            res.status(200).json({
                message: "Change password successfully"
            });
            return;
        }).catch(err => {
            res.status(500).json({
                err: "Error happened at validate password"
            });
            return;
        });
    }).catch(err => {
        res.status(500).json({
            err
        });
        return;
    });
};

export const postForgot = (_req: Request, res: Response): void => {
    res.send("Under development");
    return;
};

export const getVerify = (req: Request, res: Response): void => {
    const newUserSecret = req.params.secret;
    if (newUserSecret) {
        logger.debug(`Secret: ${newUserSecret}`);
        User.findOne({ "secret": newUserSecret }).exec((err, user) => {
            if (err) {
                logger.debug(err);
                res.status(500).json({ "error": "Error verifying user: " + err });
                return;
            } else if (!user) {
                res.status(400).json({ "error": "Invalid username/password" });
                return;
            }

            //check secret if match
            if (user.secret == newUserSecret) {
                user.isConfirmed = true;
                user.save();
                res.status(201).json({
                    message: "Verify account successful"
                });
                return;
            } else {
                res.status(400).json({
                    error: "Token secret does not mach"
                });
                return;
            }
        });
    } else {
        res.status(400).json({ error: "Secret not defined" });
        return;
    }
};
