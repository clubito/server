import { Request, Response, NextFunction } from "express";
import Club from "@models/Club";
import logger from "@logger";
import joi from "joi";
import { PERMISSIONS } from "@models/enums";
import Role from "@models/Role";

const getRoleSchema = joi.object().keys({
    id: joi.string().required()
});

const putRoleSchema = joi.object().keys({
    id: joi.string().required(),
    name: joi.string(),
    permissions: joi.array().items(joi.string())
});

const deleteRoleSchema = joi.object().keys({
    id: joi.string().required()
});

interface IReturnedRoles {
    name: string,
    permissions: string[],
    preset: boolean
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
                preset: role.preset
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

        res.status(200).json({ message: "Sucessfully updated role" });
        return;
    } catch (err) {
        return next(err);
    }
};

export const deleteClubRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { error } = deleteRoleSchema.validate(req.body);

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

        await roleObj.delete();
        res.status(200).json({ message: "Sucessfully deleted role" });
        return;
    } catch (err) {
        return next(err);
    }
};