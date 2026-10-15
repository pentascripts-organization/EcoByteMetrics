import {NextFunction, Request, Response} from "express";
import {
    UserError,
    createUserService,
    deleteUserService,
    getUserByIdService,
    updateUserService} 
    from "./user.service";


function handleError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof UserError) {
        res.status(error.statusCode).json({ erro: error.message });
    } 
    next(error);
}

export async function createUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const user = await createUserService(req.body);
        res.location(`${req.baseUrl}/${user.id_user}`).status(201).json(user);
    } catch (error) {
        handleError(error, res, next);
    }
}
export async function getUserByIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id)
        const user = await getUserByIdService(id);
        res.status(200).json(user);
    } catch (error) {
        handleError(error, res, next);
    }
}

export async function updateUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const user = await updateUserService({id_user: Number(req.params.id), ...req.body});
        res.status(200).json(user);
    } catch (error) {
        handleError(error, res, next);
    }
}

export async function deleteUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const user = await deleteUserService(Number(req.params.id));
        res.status(200).json(user);
    } catch (error) {
        handleError(error, res, next);
    }
}