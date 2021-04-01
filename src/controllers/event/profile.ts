// create/edit/delete events
import { NextFunction, Request, Response } from "express";
import logger from "@logger";
import joi from "joi";
import { ObjectId } from "mongodb";
import Event from "@models/Event";
import Club from "@models/Club";

interface IReturnedEvent {
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

export const getEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = getEventSchema.validate(req.query);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const eventId = req.query.id;

        const event = await Event.findById(eventId).exec();
        const club = await Club.findOne({ _id: event?.club, "deleted.isDeleted": false }).exec();

        if (!event) {
            res.status(400).json({ error: "Event with the ID not found" });
            return;
        }

        if (!club) {
            res.status(400).json({ error: "Club for that event does not exist" });
            return;
        }

        const returnedEvent: IReturnedEvent = {
            clubId: club._id,
            clubName: club.name,
            description: event.description,
            endTime: event.endTime,
            lastUpdated: event.lastUpdated,
            latitude: event.latitude,
            longitude: event.longitude,
            name: event.name,
            picture: event.picture,
            shortLocation: event.shortLocation,
            startTime: event.startTime
        };

        res.send(returnedEvent);
        return;
    } catch (err) {
        return next(err);
    }
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

            const returnedEvents: IReturnedEvent[] = [];

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