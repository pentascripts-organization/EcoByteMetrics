import {NextFunction, Request, Response} from "express";

import{
    LocationError,
    createLocation,
    getLocationById,
    listLocationALl
}from "./location.service";

function handleError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof LocationError) {
        res.status(error.statusCode).json({ erro: error.message });
    }
}

export async function createLocationController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const location = await createLocation(req.body);
        res.location(`${req.baseUrl}/${location.id_location}`).status(201).json(location);
    } catch (error) {
        handleError(error, res, next);
    }
}

export async function getLocationByIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const location = await getLocationById(Number(req.params.id_location));
        res.status(200).json(location);
    } catch (error) {
        handleError(error, res, next);
    }
}
export async function listLocationController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const location = await listLocationALl();
        res.status(200).json(location);
    } catch (error) {
        handleError(error, res, next);
    }
}