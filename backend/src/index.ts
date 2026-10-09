import { type Request, type Response } from 'express';
import { Router } from "express";

const router = Router();

router.use("/", (_req:Request, res:Response)=>{
    res.status(200).json({
        Rota :"Rota API Ativa"
    })
});
 
export default router;