# 📄 Sprint Review — Sprint 1

## Projeto: EcoByteMetrics (GreenER) | Período: 13/04/2026 a 30/04/2026

---

## 🎥 1. Demonstração em Vídeo & Evidências Principais

<table>
  <tr>
    <td width="50%" align="center" valign="middle">
      <!-- target="_blank" garante a abertura em nova guia no navegador -->
      <a href="https://www.youtube.com/watch?v=ID_DO_VIDEO" target="_blank">
        <img src="https://img.youtube.com/vi/ID_DO_VIDEO/mqdefault.jpg" 
             alt="Prévia do Vídeo da Sprint Review" 
             width="100%" />
      </a>
    </td>
    <td width="60%" valign="top">
      <h4>🎬 Demonstração Prática — Sprint Review 1</h4>
      <p>Neste vídeo, a equipe apresenta o incremento funcional desenvolvido durante a primeira Sprint do <b>EcoByteMetrics (GreenER)</b>:</p>
      <ul>
        <li><b>Orquestração Docker:</b> Subida unificada do ambiente containerizado (Frontend, Backend e PostgreSQL).</li>
        <li><b>Persistência Nativa:</b> Execução dos scripts <code>database/ddl.sql</code> diretamente no PostgreSQL sem o uso de ORM.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🎯 2. Objetivo da Sprint
**Estabelecer a fundação do projeto**, contemplando a orquestração da infraestrutura containerizada via Docker Compose, a modelagem do esquema relacional DDL no PostgreSQL sem ORM, a estruturação inicial das aplicações em Node.js e React com TypeScript, e a implementação do serviço de polling para descoberta dinâmica de microsserviços.

---

## 📊 3. Resumo Enxuto de Entregas (US00, US01, US02)

| User Story | Sub-issues Concluídas | Requisitos Cobertos |
| :--- | :--- | :--- |
| **US00 (#2)** — Setup Infra & Schema SQL | `#12`, `#13`, `#14`, `#15`, `#16`, `#43`, `#44`, `#47` | RNF05, RP02, RP03, RP04 |
| **US01 (#3)** — UI Responsiva & Localização | `#17`, `#49`, `#52` | RF11, RF12, RNF01, RP01 |
| **US02 (#4)** — Polling & Descoberta Dinâmica | `#20`, `#21`, `#22`, `#23` | RF01, RF02, RF03 |

<details>
<summary><b>🔍 Clique aqui para expandir a lista simplificada de tarefas entregues</b></summary>

* **US00 — Documentação e Infraestrutura (#2):** Prototipagem Figma (`#16`), Diagramas C4/Mermaid (`#43`), MER (`#44`), Script DDL Nativo (`#12`), Container PostgreSQL (`#13`), Docker Compose (`#14`), Documentação REST (`#47`) e README (`#15`).
* **US01 — Interface e Localização (#3):** Componentes React+TS (`#17`), Exibição de Cidade (`#49`) e Timestamp da Última Atualização (`#52`).
* **US02 — Backend e Polling (#4):** Servidor Node.js Modular (`#20`), Consumo de `/services` (`#21`), Polling Periódico (`#22`) e Coleta `/metrics/{id}` (`#23`).

</details>

---

## 📝 4. Avaliação Geral da Sprint 1 & Pontos de Atenção para a Sprint 2

* **O que funcionou bem:** A modularização do backend Node.js e a containerização via Docker Compose garantiram a subida rápida e estável do ambiente.
* **Pontos de atenção para a Sprint 2:** Foco na execução das histórias **US03**, **US04**, **US05** e **US06** (Motor de cálculos de kWh/CO₂e, carga DML, Dashboard com ordenação e autenticação JWT).
