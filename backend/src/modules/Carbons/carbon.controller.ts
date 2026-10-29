import {NextFunction, Request, Response} from "express";
import {
    CarbonError,
    createCarbonService,
    getCarbonByIdService,
    listCarbonsByLocationIdService,
    listCarbonsService
    } from "./carbon.service";

function handleError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof CarbonError) {
        res.status(error.statusCode).json({ erro: error.message });
    }
}

export async function createCarbonController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const carbon = await createCarbonService(req.body);
        res.location(`${req.baseUrl}/${carbon.id_carbon}`).status(201).json(carbon);
    } catch (error) {
        handleError(error, res, next);
    }
}
export async function getCarbonByIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const carbon = await getCarbonByIdService(Number(req.params.id_service));
        res.status(200).json(carbon);
    } catch (error) {
        handleError(error, res, next);
    }
}
export async function listCarbonsByLocationIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const carbons = await listCarbonsByLocationIdService(Number(req.params.id_location));
        res.status(200).json(carbons);
    } catch (error) {
        handleError(error, res, next);
    }
}

export async function listCarbonsController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const carbons = await listCarbonsService();
        res.status(200).json(carbons);
    } catch (error) {
        handleError(error, res, next);
    }
}
