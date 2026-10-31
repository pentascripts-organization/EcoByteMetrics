import {Router} from "express";
import {
    createUserController,
    deleteUserController,
    getUserByIdController,
    updateUserController}
    from "./user.controller";

const userRouter = Router();

import { authMiddleware } from "../Auth/auth.middleware";

userRouter.post("/", createUserController);
userRouter.get("/:id_user", authMiddleware, getUserByIdController);
userRouter.put("/:id_user", authMiddleware, updateUserController);
userRouter.delete("/:id_user", authMiddleware, deleteUserController);

userRouter.get("/", (req, res) => {
    res.set("Allow", "GET, HEAD, POST, OPTIONS").status(204).end();
});

userRouter.post("/:id_user", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS").status(204).end();
});

userRouter.all("/:id_user", (req, res) => {
    res.set("Allow", "GET, HEAD, PUT, DELETE, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
})

userRouter.all("/", (req, res) => {
    res.set("Allow", "GET, HEAD, POST, OPTIONS")
    .status(405).json({ error: "Método não permitido" });
});

export default userRouter;