import { Request, Response } from "express";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";
import { isValidPushToken } from "@notifications";

const postRegisterPushTokenSchema = joi.object().keys({
    pushToken: joi.string().required()
});

export const postRegisterPushToken = async (req: Request, res: Response): Promise<void> => {
    const { error } = postRegisterPushTokenSchema.validate(req.body); // makes sure pushtoken is specified

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }
    try {
        const { pushToken } = req.body;
        const userId = req.userId;

        const user = await User.findById(userId);

        if (!user) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        if (!isValidPushToken(pushToken)) {
            res.status(400).json({ error: "Given push token is not valid", pushToken });
            return;
        }

        user.pushToken = pushToken;
        await user.save();
        res.status(200).json({ message: "Successfully registered push token for user", userId: user._id });
        return;
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: err });
        return;
    }
};