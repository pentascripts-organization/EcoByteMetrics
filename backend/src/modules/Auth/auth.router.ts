/* Define a rota POST /auth/login. */
import { Router } from "express";
import { loginController } from "./auth.controller";

const authRouter = Router();

authRouter.post("/login", loginController);

export default authRouter;