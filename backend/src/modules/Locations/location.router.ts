import{Router} from "express";

import{
    createLocationController,
    getLocationByIdController,
    listLocationController
}from "./location.controller";

const locationRouter = Router();

locationRouter.get("/all", listLocationController);
locationRouter.post("/", createLocationController);
locationRouter.get("/:id", getLocationByIdController);

locationRouter.post("/all", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS").status(204).end();
});

locationRouter.get("/", (req, res) => {
    res.set("Allow", "GET, HEAD, POST, OPTIONS").status(204).end();
});

locationRouter.post("/:id", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS").status(204).end();
});


locationRouter.all("/all", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});

locationRouter.all("/", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});

locationRouter.all("/:id", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});



export default locationRouter;