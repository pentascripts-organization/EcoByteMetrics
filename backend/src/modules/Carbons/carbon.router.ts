import {Router} from "express";
import {
    createCarbonController,
    getCarbonByIdController,
    listCarbonsByLocationIdController,
    listCarbonsController
} from "./carbon.controller";
import { authMiddleware } from "../Auth/auth.middleware";

const router = Router();

// define rotas para lidar com os métodos permitidos
router.get("/all", listCarbonsController);
router.get("/loc/:id", listCarbonsByLocationIdController);
router.post("/", authMiddleware, createCarbonController);
router.get("/:id", getCarbonByIdController);

// define rotas para lidar com métodos não permitidos
router.get("/all/", (req, res) => {
    res.set("Allow", "GET, HEAD, OPTIONS").status(204)
    .json({ Mensagem: "Não existe um registro." }).end();
});
router.get("/", (req, res) => {
    res.set("Allow", "GET, HEAD, POST, OPTIONS").status(204).end();
});
router.post("/:id", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS").status(204)
    .json({ Mensagem: "Não existe um registro." }).end();
}); 

router.get("/loc/:id", (req, res) => {
    res.set("Allow", "GET, HEAD, OPTIONS").status(204)
    .json({ Mensagem: "Não existe um registro." }).end();
});


// define rotas para lidar com métodos não permitidos
router.all("/", (req, res) => {
    res.set("Allow", "GET, HEAD, POST, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});
router.all("/:id", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
}); 
router.all("/loc/:id", (req, res) => {
    res.set("Allow", "GET, HEAD, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});
router.all("/all/", (req, res) => {
    res.set("Allow", "GET, HEAD, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
}); 

export default router;