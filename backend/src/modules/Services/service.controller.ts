import {NextFunction, Request, Response} from "express";

import{
    ServicesError,
    createService,
    listServiceByLocation,
    listServices,
    getServiceById
}from"./services.service"

function handleError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof ServicesError) {
        res.status(error.statusCode).json({ erro: error.message });
    }
}

export async function createServiceController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const service = await createService(req.body);
        res.location(`${req.baseUrl}/${service.id_service}`).status(201).json(service);
    } catch (error) {
        handleError(error, res, next);
    }
}

export async function getServiceByIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const service = await getServiceById(Number(req.params.id_service));
        res.status(200).json(service);
    } catch (error) {
        handleError(error, res, next);
    }
}

export async function listServiceByLocationIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const service = await listServiceByLocation(Number(req.params.id_location));
        res.status(200).json(service);
    } catch (error) {
        handleError(error, res, next);
    }
}

export async function listServiceController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const service = await listServices();
        res.status(200).json(service);
    } catch (error) {
        handleError(error, res, next);
    }
}