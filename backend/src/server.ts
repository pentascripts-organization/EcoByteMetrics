import app from "./app.js";
import { CarbonApiError } from "./integrations/carbon-api.js";
import { ServiceApiError } from "./integrations/services-api.js";
import { refreshAllData } from "./modules/Worker/worker.job.js";
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    const REFRESH_INTERVAL = 30_000;
    console.log(
        `Servidor BackEnd está rodando http://localhost:${PORT}`
    );
      // Primeira coleta ao iniciar o servidor.
  void refreshAllData()
    .then(() => {
      console.log("Serviços e métricas carregados com sucesso.");
    })
    .catch((error: unknown) => {
      if(error instanceof ServiceApiError || error instanceof CarbonApiError){
              console.error(
                `${error.name}: ${error.message}\n` +
                `statusCode: ${error.statusCode}\n` );
      }else{
         console.error("Erro desconhecido ",error);
       }
    });

  // Atualiza a lista e as métricas a cada 30 segundos.
  setInterval(() => {
    void refreshAllData()
      .then(() => {
        console.log("Lista de serviços e métricas atualizada.");
      })
      .catch((error: unknown) => {
        if(error instanceof ServiceApiError || error instanceof CarbonApiError){
              console.error(
                `${error.name}: ${error.message}\n` +
                `statusCode: ${error.statusCode}\n` );
        }else{
            console.error("Erro desconhecido ",error);
        }
      });
  }, REFRESH_INTERVAL);
});