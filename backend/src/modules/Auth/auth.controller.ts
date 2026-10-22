/* Recebe e-mail e senha, chama o serviço e monta a resposta HTTP. */
import type { Request, Response } from "express";
import {
  AuthError,
  loginService,
} from "./auth.service";

export async function loginController(
  req: Request,
  res: Response
): Promise<void> {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    res.status(400).json({
      message: "Informe o e-mail e a senha.",
    });
    return;
  }

  try {
    const result = await loginService({ email, password });

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
      return;
    }

    console.error("Erro interno durante o login.");

    res.status(500).json({
      message: "Erro interno ao realizar login.",
    });
  }
}
