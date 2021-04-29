import { Request, Response, NextFunction } from "express";
import Club from "@models/Club";
import logger from "@logger";
import joi from "joi";
import { PERMISSIONS } from "@models/enums";
import Role from "@models/Role";
import User from "@models/User";

const getRoleSchema = joi.object().keys({
    id: joi.string().required()
});

const putRoleSchema = joi.object().keys({
    id: joi.string().required(),
    name: joi.string(),
    permissions: joi.array().items(joi.string())
});

const postRoleSchema = joi.object().keys({
    id: joi.string().required(),
    name: joi.string().required(),
    permissions: joi.array().items(joi.string()).required()
});

const deleteRoleSchema = joi.object().keys({
    id: joi.string().required()
});

const postAssignClubRoleSchema = joi.object().keys({
    roleId: joi.string().required(),
    userId: joi.string().required(),
    clubId: joi.string().required(),
});

interface IReturnedRoles {
    name: string,
    permissions: string[],
    preset: boolean,
    id: string
}

export const getClubRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = getRoleSchema.validate(req.query);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const clubId = req.query.id;

        const currClub = await Club.findById(clubId).populate("roles").exec();

        const returnedRoles: IReturnedRoles[] = [];

        currClub?.roles.forEach(role => {
            returnedRoles.push({
                name: role.name,
                permissions: role.permissions,
                preset: role.preset,
                id: role._id
            });
        });

        res.status(200).json(returnedRoles);
        return;
    } catch (err) {
        return next(err);
    }
};

export const putClubRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = putRoleSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const roleId = req.body.id;
        const roleObj = await Role.findById(roleId).exec();

        if (!roleObj) {
            res.status(400).json({ error: "No role with that id" });
            return;
        }

        const { name, permissions } = req.body;

        if (name) {
            roleObj.name = name;
        }

        const wrongPermissions: string[] = [];
        const correctPermissions: string[] = [];

        if (permissions) {
            permissions.forEach((permission) => {
                if (Object.values(PERMISSIONS).includes(permission.toUpperCase())) {
                    correctPermissions.push(permission.toUpperCase());
                } else {
                    wrongPermissions.push(permission);
                }
            });

            roleObj.permissions = correctPermissions;
        }

        if (wrongPermissions.length > 0) {
            res.status(400).json({ error: "The following permissions do not exist", permissions: wrongPermissions });
            return;
        }

        await roleObj.save();

        res.status(200).json({ message: "Sucessfully updated role" });
        return;
    } catch (err) {
        return next(err);
    }
};

export const postClubRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = postRoleSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const { name, permissions } = req.body;
        const clubId = req.body.id;

        const club = await Club.findOne({ _id: clubId, "deleted.isDeleted": false }).exec();

        if (!club) {
            res.status(400).json({ error: "Club for that event does not exist" });
            return;
        }

        const wrongPermissions: string[] = [];
        const correctPermissions: string[] = [];

        if (permissions) {
            permissions.forEach((permission) => {
                if (Object.values(PERMISSIONS).includes(permission.toUpperCase())) {
                    correctPermissions.push(permission.toUpperCase());
                } else {
                    wrongPermissions.push(permission);
                }
            });
        }

        if (wrongPermissions.length > 0) {
            res.status(400).json({ error: "The following permissions do not exist. Not creating a new role. Please try again.", permissions: wrongPermissions });
            return;
        }

        const newRole = new Role({
            name: name,
            permissions: correctPermissions
        });

        club.roles.push(newRole._id);
        await newRole.save();
        await club.save();

        res.status(200).json({ message: "Sucessfully created role" });
        return;
    } catch (err) {
        return next(err);
    }
};

export const deleteClubRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = deleteRoleSchema.validate(req.query);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const roleId = req.query.id;
        const roleObj = await Role.findById(roleId).exec();

        if (!roleObj) {
            res.status(400).json({ error: "No role with that id" });
            return;
        }

        await roleObj.delete();
        res.status(200).json({ message: "Sucessfully deleted role" });
        return;
    } catch (err) {
        return next(err);
    }
};

export const postAssignClubRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = postAssignClubRoleSchema.validate(req.body);

    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    try {
        const { roleId, clubId, userId } = req.body;

        const roleObj = await Role.findById(roleId).exec();
        const clubObj = await Club.findOne({ _id: clubId, "deleted.isDeleted": false })
            .populate({
                path: "members",
                populate: { path: "member" }
            })
            .exec();
        const userObj = await User.findById(userId)
            .populate({
                path: "clubs",
                populate: { path: "club" }
            })
            .populate({
                path: "clubs",
                populate: { path: "role2" }
            })
            .exec();

        if (!roleObj) {
            res.status(400).json({ error: "No role with that id" });
            return;
        }

        if (!clubObj) {
            res.status(400).json({ error: "No club with that id" });
            return;
        }

        if (!userObj) {
            res.status(400).json({ error: "No user with that id" });
            return;
        }

        userObj.clubs.forEach(userClub => {
            if (userClub.club._id.equals(clubId)) {
                userClub.role2 = roleId;
            }
        });

        clubObj.members.forEach(member => {
            if (member.member._id.equals(userId)) {
                member.role2 = roleId;
            }
        });

        await userObj.save();
        await clubObj.save();
        res.status(200).json({ message: "Sucessfully updated user's role" });
        return;
    } catch (err) {
        return next(err);
    }
};