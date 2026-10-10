
import app from "./app.js";
import {
    refreshDiscoveredServices,
} from "./modules/services/services.service.js";

const PORT = process.env.PORT || 3000;

// Intervalo de atualização: 30 segundos.
const REFRESH_INTERVAL = 30_000;

// Inicia o servidor backend.
app.listen(PORT, () => {
    console.log(
        `Servidor BackEnd está rodando http://localhost:${PORT}`
    );

    // Faz a primeira consulta ao Agregador assim que o servidor inicia.
    void refreshDiscoveredServices()
        .then(() => {
            console.log("Serviços do Agregador carregados com sucesso.");
        })
        .catch((error: unknown) => {
            console.error(
                "Não foi possível carregar os serviços do Agregador:",
                error
            );
        });

    // Atualiza a lista de serviços a cada 30 segundos.
    setInterval(() => {
        void refreshDiscoveredServices()
            .then(() => {
                console.log("Lista de serviços atualizada.");
            })
            .catch((error: unknown) => {
                console.error(
                    "Falha ao atualizar os serviços do Agregador. " +
                    "O último cache válido será preservado.",
                    error
                );
            });
    }, REFRESH_INTERVAL);
});
