/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";

const postSettingsSchema = joi.object().keys({
    settings: {
        notifications: {
            enabled: joi.boolean().required()
        }
    }
});

interface ISettingsBody {
    settings: {
        notifications: {
            enabled: boolean
        }
    }
}

export const postSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = postSettingsSchema.validate(req.body);
    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        throw error;
    }

    try {
        const userId = req.userId;
        const settingsBody: ISettingsBody = req.body;

        const user = await User.findById(userId).exec();

        if (!user) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        user.settings.notifications.enabled = settingsBody.settings.notifications.enabled;
        await user.save();

        res.status(200).json({ message: "Successfully updated user settings" });
        return;
    } catch (err) {
        return next(err);
    }

};