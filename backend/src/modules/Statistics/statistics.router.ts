import {StatisticController} from "./statistics.controller";
import {Router} from "express";

const router = Router();
const statistics = new StatisticController();

//http://localhost:3000/api/statistics/summary
router.get("/summary", statistics.summary);

//http://localhost:3000/api/statistics/ranking
//http://localhost:3000/api/statistics/ranking?periodo=24h&ordenarPor=kwh
//http://localhost:3000/api/statistics/ranking?periodo=7d&ordenarPor=co2e
router.get("/ranking", statistics.ranking);

export default router;
