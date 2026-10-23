import {Router} from "express";
import{
    createServiceController,
    getServiceByIdController,
    listServiceByLocationIdController,
    listServiceController
}from "./service.controller"
import { authMiddleware } from "../Auth/auth.middleware";

const serviceRouter = Router();

serviceRouter.get("/all", listServiceController);
serviceRouter.get("/loc/:id", listServiceByLocationIdController);
serviceRouter.post("/", authMiddleware, createServiceController);
serviceRouter.get("/:id", getServiceByIdController);

serviceRouter.post("/loc/:id", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS").status(204).end();
});

serviceRouter.post("/all", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS").status(204).end();
});
serviceRouter.get("/", (req, res) => {
    res.set("Allow", "GET, HEAD, POST, OPTIONS").status(204).end();
});

serviceRouter.post("/:id", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS").status(204).end();
});

serviceRouter.all("/loc/:id", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});

serviceRouter.all("/all", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});
serviceRouter.all("/", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});

serviceRouter.all("/:id", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});



export default serviceRouter;