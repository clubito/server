// // create/edit/delete events
// import { Request, Response } from "express";
// import Club from "@models/Club";
// import User from "@models/User";
// import logger from "@logger";
// import joi from "joi";
// import { CLUB_ROLE } from "@models/enums";
// import { ObjectId } from "mongodb";
// import Event from "@models/Event";

// const postAddRsvpSchema = joi.object().keys({
//     eventId: joi.string().custom((value, helper) => {
//         if (ObjectId.isValid(value)) {
//             return value;
//         } else {
//             return helper.message({ custom: "id is not valid" });
//         }
//     }).required()
// });

// export const postAddRsvp = (req: Request, res: Response): void => {
//     const { error } = postAddRsvpSchema.validate(req.body);

//     if (error) {
//         res.status(400).json({ "error": error.message });
//         logger.debug(error);
//         return;
//     }

//     const { eventId } = req.body;
//     const userId = req.userId;

//     User.findById(userId)
//         .then(user => {
//             if (!user) {
//                 res.status(400).json({ error: "User not found" });
//                 return;
//             }

//             Club
//                 .findOne({ _id: clubId, "deleted.isDeleted": false })
//                 .populate("events")
//                 .then(club => {
//                     if (!club) {
//                         res.status(400).json({ error: "Club does not exist" });
//                         return;
//                     }
//                     // Make sure the user is allowed to make events
//                     club.members.forEach(member => {
//                         if (member.member.equals(userId)) {
//                             if (member.role == CLUB_ROLE.MEMBER || member.role == CLUB_ROLE.NONMEMBER) {
//                                 // If the user is only a normal member or not even a member,
//                                 // then don't let them make an event
//                                 res.status(400).json({ error: "Current user does not have permission to do that." });
//                                 return;
//                             }
//                         }
//                     });

//                     // Event does not already exist
//                     club.events.forEach(event => {
//                         if (event.name === name) {
//                             res.status(400).json({ error: "An event with that name already exists. Did you mean to edit the event?" });
//                             return;
//                         }
//                     });

//                     const newEvent = new Event({
//                         name,
//                         description,
//                         startTime,
//                         endTime,
//                         longitude,
//                         latitude,
//                         shortLocation,
//                         picture,
//                         club: clubId
//                     });

//                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                     newEvent.save((err: any, createdEvent) => {
//                         if (err || !createdEvent) {
//                             if (err.code == 11000) {
//                                 res.status(400).json({ error: "An event with that name already exists. Did you mean to edit the event?" });
//                             } else {
//                                 res.status(400).json({ error: "Error creating an event: " + err?.message });
//                             }
//                             return;
//                         }

//                         res.status(200).json({
//                             message: "Successfully created event",
//                             eventId: createdEvent["_id"]
//                         });
//                         return;
//                     });
//                 });
//         })
//         .catch(err => {
//             logger.error(err);
//             res.status(500).json({ error: err });
//             return;
//         });
// };
