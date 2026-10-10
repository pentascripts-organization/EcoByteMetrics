import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor BackEnd esta rodando http://localhost:${PORT}\n`);
});