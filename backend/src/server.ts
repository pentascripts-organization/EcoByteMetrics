import app from "./app.js";

const PORT = process.env.PORT || 3000;
const PGPORT = process.env.PGPORT;

app.listen(PORT, () => {
    console.log(`Servidor BackEnd esta rodando http://localhost:${PORT}\n`+
        `Servidor FrontEnd esta rodando http://localhost:${PGPORT}`
    );
});