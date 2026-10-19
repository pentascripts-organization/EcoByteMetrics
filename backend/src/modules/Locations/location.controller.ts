import {NextFunction, Request, Response} from "express";
/* Controlador para gerenciar operações relacionadas a localizações.
   Este módulo fornece funções para criar, buscar por ID e listar todas as localizações.
   Ele lida com erros específicos de localização e envia respostas HTTP apropriadas.
*/
import{
    LocationError,
    createLocation,
    getLocationById,
    listLocationALl
}from "./location.service";
/* Função handleError que trata erros específicos de localização,
    enviando uma resposta HTTP com o status e a mensagem de erro apropriados.
*/
function handleError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof LocationError) {
        res.status(error.statusCode).json({ erro: error.message });
    }
}
/* Função assíncrona createLocationController que lida com a criação de uma nova localização.
   Ela chama a função createLocation do serviço, envia uma resposta HTTP com o status 201 (Criado) e a localização criada.
   Em caso de erro, chama a função handleError para tratar o erro.
*/
export async function createLocationController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const location = await createLocation(req.body);
        res.location(`${req.baseUrl}/${location.id_location}`).status(201).json(location);
    } catch (error) {
        handleError(error, res, next);
    }
}
/* Função assíncrona getLocationByIdController que lida com a busca de uma localização por ID.
   Ela chama a função getLocationById do serviço, envia uma resposta HTTP com o status 200 (OK) e a localização encontrada.
   Em caso de erro, chama a função handleError para tratar o erro.
*/
export async function getLocationByIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const location = await getLocationById(Number(req.params.id_location));
        res.status(200).json(location);
    } catch (error) {
        handleError(error, res, next);
    }
}
/* Função assíncrona listLocationController que lida com a listagem de todas as localizações.
   Ela chama a função listLocationALl do serviço, envia uma resposta HTTP com o status 200 (OK) e a lista de localizações encontradas.
   Em caso de erro, chama a função handleError para tratar o erro.
*/
export async function listLocationController(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const location = await listLocationALl();
        res.status(200).json(location);
    } catch (error) {
        handleError(error, res, next);
    }
}