// create/edit/delete events
import { Request, Response } from "express";
import logger from "@logger";
import joi from "joi";
import { ObjectId } from "mongodb";
import Event from "@models/Event";

const getEventSchema = joi.object().keys({
    id: joi.string().custom((value, helper) => {
        if (ObjectId.isValid(value)) {
            return value;
        } else {
            return helper.message({ custom: "id is not valid" });
        }
    }).required()
});

export const getEvent = (req: Request, res: Response): void => {
    const { error } = getEventSchema.validate(req.query);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const eventId = req.query.id;

    Event.findById(eventId).then(event => {
        if (!event) {
            res.status(400).json({ error: "Event with the ID not found" });
            return;
        }

        res.send(event);
        return;
    });

};