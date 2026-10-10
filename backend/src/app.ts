import express, { type Request, type Response } from "express";
import cors from "cors";
import routes from "./index.js";
import pool from "./db/connection.js";

const app = express();

app.use(cors());

app.use(express.json());
//saude do backend
app.use("/health", (_req:Request, res:Response)=>{
    res.json({ status: "ok" });
});

app.use("/",(_req:Request, res:Response )=>{

    async function usuarioNome():Promise<void> {
        
        try{
            const response = await pool.query("Select name_user from users")
            res.status(200).json({
                mensagem: response.rows[0].name_user
            })
        }catch (error) {
            console.error('Erro ao executar o arquivo SQL');
            res.status(500).json({
                mensagem: "Erro de Chamada é : "+error
            })
            throw error;
        }
    }
    usuarioNome();

});

//Rota da API
app.use("/api", routes);

export default app;