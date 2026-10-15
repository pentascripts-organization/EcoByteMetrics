import {Router} from "express";
import {
    createMetricController,
    getMetricByIdController,
    listMetricsByServiceIdController,
} from "./metric.controller";

const router = Router();

router.get("/list/:id_service", listMetricsByServiceIdController);
router.post("/", createMetricController);
router.get("/:id", getMetricByIdController);


router.get("/", (req, res) => {
    res.set("Allow", "GET, HEAD, POST, OPTIONS").status(204).end();
});
router.post("/:id", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS").status(204).end();
});
router.get("/list/:id_service", (req, res) => {
    res.set("Allow", "GET, HEAD, OPTIONS").status(204).end();
});


router.all("/:id", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});
router.all("/", (req, res) => {
    res.set("Allow", "GET, HEAD, POST, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});
router.all("/list/:id_service", (req, res) => {
    res.set("Allow", "GET, HEAD, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});


export default router;