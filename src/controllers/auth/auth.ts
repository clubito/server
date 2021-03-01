import { Request, Response } from "express";
import User from "models/User";
import logger from "logger";
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
    const {email, password} = req.body;

    // 

    res.json({
        email,
        password
    });
    return;
};