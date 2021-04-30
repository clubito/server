/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";

const putSettingsSchema = joi.object().keys({
    settings: {
        notifications: {
            enabled: joi.boolean(),
            disabledClubs: joi.array().items(joi.string()),
        }
    }
});

export const putSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = putSettingsSchema.validate(req.body);
    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        throw error;
    }

    try {
        const userId = req.userId;
        const notificationsEnabled = req.body.settings.notifications.enabled;
        const disabledClubs = req.body.settings.notifications.disabledClubs;

        const user = await User.findById(userId).exec();

        if (!user) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        if (notificationsEnabled) {
            user.settings.notifications.enabled = notificationsEnabled;
        }

        if (disabledClubs) {
            user.settings.notifications.disabledClubs = disabledClubs;
        }

        await user.save();

        res.status(200).json({ message: "Successfully updated user settings" });
        return;
    } catch (err) {
        return next(err);
    }
};