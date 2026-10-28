import {NextFunction, Request, Response} from "express";
import {
    MetricError,
    createMetricService,
    getMetricByIdService,
    listMetricsByServiceIdService
    } from "./metric.service";

function handleError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof MetricError) {
        res.status(error.statusCode).json({ erro: error.message });
    }
}
export async function createMetricController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const metric = await createMetricService(req.body);
        res.location(`${req.baseUrl}/${metric.id_metric}`).status(201).json(metric);
    } catch (error) {
        handleError(error, res, next);
    }
}
export async function getMetricByIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const metric = await getMetricByIdService(Number(req.params.id_metric));
        res.status(200).json(metric);
    } catch (error) {
        handleError(error, res, next);
    }
}
export async function listMetricsByServiceIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const metrics = await listMetricsByServiceIdService(Number(req.params.id_service));
        res.status(200).json(metrics);
    } catch (error) {
        handleError(error, res, next);
    }
}