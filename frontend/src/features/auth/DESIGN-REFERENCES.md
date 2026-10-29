# Referências do acesso

O login e o cadastro mantêm o formulário centralizado e usam o mesmo componente `TopographicSides` do dashboard, com fundo branco e curvas discretas nas laterais.

- [shadcn/ui — login-03](https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/new-york-v4/blocks/login-03): composição centralizada, formulário compacto em um cartão e hierarquia dos campos. [Licença MIT](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

O fundo é estático, sem canvas, WebGL ou eventos de interação. Os SVGs e as regras de adaptação para telas menores são compartilhados com o monitoramento.

Nenhum pacote adicional foi instalado. O formulário de login está conectado ao backend, com mensagens, carregamento e sessão em memória. O cadastro permanece desativado até sua integração em uma próxima etapa.
