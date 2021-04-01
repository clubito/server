/* eslint-disable @typescript-eslint/no-explicit-any */
// create/edit/delete events
import { NextFunction, Request, Response } from "express";
import User from "@models/User";
import logger from "@logger";
import joi from "joi";
import { ObjectId } from "mongodb";
import Event from "@models/Event";

const postAddRsvpSchema = joi.object().keys({
    eventId: joi.string().custom((value, helper) => {
        if (ObjectId.isValid(value)) {
            return value;
        } else {
            return helper.message({ custom: "id is not valid" });
        }
    }).required()
});

export const postAddRsvp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = postAddRsvpSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const { eventId } = req.body;
        const userId = req.userId;

        const user = await User.findById(userId).exec();
        const event = await Event.findById(eventId).exec();

        if (!user) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        if (!event) {
            res.status(400).json({ error: "Event not found" });
            return;
        }

        if (new Date(event.endTime) < new Date(Date.now())) {
            // Event has already ended
            res.status(400).json({ error: "Event has already ended" });
            return;
        }

        if (event.rsvpUsers.some(member => member.equals(userId))) {
            res.status(200).json({ error: "User has already RSVP'd for this event" });
            return;
        }

        event.rsvpUsers.push(user._id);
        user.allRSVP.push(event._id);

        await event.save();
        await user.save();
        res.status(200).json({ message: "Successfully RSVP'd to event" });
        return;
    } catch (err) {
        return next(err);
    }
};

export const postDeleteRsvp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = postAddRsvpSchema.validate(req.body); // same schema

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const { eventId } = req.body;
        const userId = req.userId;

        const user = await User.findById(userId).exec();
        const event = await Event.findById(eventId).exec();

        if (!user) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        if (!event) {
            res.status(400).json({ error: "Event not found" });
            return;
        }

        if (!event.rsvpUsers.some(member => member.equals(userId))) {
            // User has not RSVPd for this event
            res.status(200).json({ error: "User has not RSVP'd for this event" });
            return;
        }

        // club.members = (club?.members as any[]).filter(item => { return !item.member.equals(user._id); });
        event.rsvpUsers = (event.rsvpUsers as any[]).filter(item => { return !item.equals(userId); });
        user.allRSVP = (user.allRSVP as any[]).filter(item => { return !item.equals(eventId); });

        await event.save();
        await user.save();
        res.status(200).json({ message: "Successfully cancelled RSVP to event" });
        return;
    } catch (err) {
        return next(err);
    }
};