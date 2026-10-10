# EcoByteMetrics
EcoByteMetrics — Uma plataforma web voltada à análise e ao monitoramento do consumo energético e da emissão de CO₂e de softwares.

O frontend está implementado em React com TypeScript: apresentação, pesquisa regional com globo 3D, dashboard, serviços, emissões, energia, comparação, gerenciamento, login e preferências de visualização. Ele consome as APIs do desafio e calcula estimativas de energia e CO₂e para os serviços simulados. O histórico permanece na sessão do navegador; o login e o gerenciamento real de usuários ainda dependem do backend.

Para executar somente o frontend com Docker:

```sh
docker compose -f frontend/compose.yaml up --build -d
```

Acesse **http://localhost:5173**. Consulte [a documentação do frontend](frontend/README.md) para desenvolvimento local, verificações e organização das telas.
