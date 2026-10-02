import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    //executarArquivoSQL();
    console.log(`Servidor BackEnd esta rodando http://localhost:${PORT}\n`+
        `Servidor FrontEnd esta rodando http://localhost:5173`
    );
});