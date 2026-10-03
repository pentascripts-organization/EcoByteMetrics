# EcoByteMetrics
EcoByteMetrics — Uma plataforma web voltada à análise e ao monitoramento do consumo energético e da emissão de CO₂e de softwares.

O frontend inicial está implementado em React com TypeScript: apresentação, dashboard, serviços, emissões, energia, comparação, login e preferências de visualização. Os indicadores permanecem vazios até a integração com o backend; o login ainda não autentica.

Para executar somente o frontend com Docker:

```sh
docker compose -f frontend/compose.yaml up --build -d
```

Acesse **http://localhost:5173**. Consulte [a documentação do frontend](frontend/README.md) para desenvolvimento local, verificações e organização das telas.
