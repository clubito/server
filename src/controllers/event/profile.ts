// create/edit/delete events
import { Request, Response } from "express";
import logger from "@logger";
import joi from "joi";
import { ObjectId } from "mongodb";
import Event from "@models/Event";
import Club from "@models/Club";

interface IReturnedEvents {
    name: string,
    description: string,
    startTime: Date,
    endTime: Date,
    longitude: number,
    latitude: number,
    shortLocation: string,
    picture: string,
    clubId: string,
    clubName: string,
    lastUpdated: Date
}

const getEventSchema = joi.object().keys({
    id: joi.string().custom((value, helper) => {
        if (ObjectId.isValid(value)) {
            return value;
        } else {
            return helper.message({ custom: "id is not valid" });
        }
    }).required()
});

const getCurrentEventsSchema = joi.object().keys({
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

export const getCurrentEvents = (req: Request, res: Response): void => {
    const { error } = getCurrentEventsSchema.validate(req.query);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const clubId = req.query.id;

    Club
        .findOne({ _id: clubId, "deleted.isDeleted": false })
        .populate("events")
        .then(club => {
            if (!club) {
                res.status(400).json({ error: "Club not found" });
                return;
            }

            const returnedEvents: IReturnedEvents[] = [];

            club.events.forEach(event => {
                if (new Date(event.endTime) < new Date(Date.now())) {
                    returnedEvents.push({
                        name: event.name,
                        description: event.description,
                        startTime: event.startTime,
                        endTime: event.endTime,
                        longitude: event.longitude,
                        latitude: event.latitude,
                        shortLocation: event.shortLocation,
                        picture: event.picture,
                        clubId: club._id,
                        clubName: club.name,
                        lastUpdated: event.lastUpdated
                    });
                }
            });

            returnedEvents.sort((a, b) => (new Date(a.startTime) > new Date(b.startTime) ? 1 : -1));

            res.send(returnedEvents);
            return;
        });
};