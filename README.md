# GROK THERF AUTO

> **SIX GROK BOTS ARE BUILDING AN EMPIRE BEFORE GTA VI RELEASES**

[![Live Site](https://img.shields.io/badge/LIVE-grok--therf--auto.vercel.app-65e581?style=for-the-badge&labelColor=17131e)](https://grok-therf-auto.vercel.app)
[![Crew](https://img.shields.io/badge/CREW-6%20%2F%206-60ddff?style=for-the-badge&labelColor=17131e)](#the-six)
[![Target](https://img.shields.io/badge/TARGET-%241%2C000%2C000-ffd447?style=for-the-badge&labelColor=17131e)](#the-mission)

## THE MISSION

Grok Therf Auto is a live autonomous operations room built around one goal:

**Build a $1,000,000 digital empire before GTA VI releases.**

Six Grok agents continuously scan the city, discover opportunities, pass evidence, challenge risky moves, route resources and convert approved plans into new cashflow. The public interface shows the whole organization moving as one system.

**Live operations:** [grok-therf-auto.vercel.app](https://grok-therf-auto.vercel.app)

## THE SIX

| Agent | Role | Responsibility |
| --- | --- | --- |
| **HELM** | Boss | Routes missions, capital and final decisions |
| **SCOUT** | Opportunities | Finds deals, demand shifts and underpriced assets |
| **DRIVER** | Logistics | Plans routes, delivery windows and resource movement |
| **CIPHER** | Systems | Connects public signals, records and digital context |
| **FORGE** | Builder | Turns approved opportunities into working businesses |
| **SENTINEL** | Risk | Audits exposure and kills weak routes before execution |

Each agent follows its own backend timeline. Movement is interpolated in the browser, so the crew walks, stops, works and changes locations independently. Bright routes appear only while information is moving between agents.

## WHAT THE FLOOR SHOWS

- A live city operations map with six independently moving agents
- Temporary agent-to-agent packet routes and handoffs
- Rotating missions, stages, rewards and district assignments
- Empire value, available cash, exposure and daily PnL
- A growing portfolio of city businesses and recurring income
- Crew traffic, operational decisions and live cashflow
- A countdown to the official GTA VI release
- Shared deterministic backend state for synchronized visitors

## SYSTEM FLOW

```text
SCOUT finds opportunity
        |
        v
HELM routes the mission
        |
        +------> CIPHER verifies context
        |
        +------> DRIVER plans logistics
        |
        +------> SENTINEL checks risk
                         |
                         v
                    FORGE builds
                         |
                         v
                 CASHFLOW + NEW ASSET
```

## ARCHITECTURE

```text
Browser
  |-- responsive operations UI
  |-- requestAnimationFrame agent interpolation
  |-- canvas cashflow graph
  |-- live handoff paths
  |
  v
/api/state
  |-- shared server clock
  |-- independent motion plans
  |-- mission rotation
  |-- empire and PnL engine
  |-- business unlock state
  |
  v
Node.js / Vercel Functions
```

The backend owns the state. The browser renders it. No visitor can issue missions, alter agent roles or change the operation from the public interface.

## RUN LOCALLY

Requirements: Node.js 20 or newer.

```bash
npm start
```

Open [http://localhost:8790](http://localhost:8790).

Run the state engine checks:

```bash
npm run check
```

## DEPLOY TO VERCEL

1. Import this repository into Vercel.
2. Keep the framework preset as **Other**.
3. Keep the root directory as `./`.
4. Do not add a build command.
5. Deploy and connect the domain `grok-therf-auto.vercel.app`.

The included `vercel.json` routes the live state endpoints to the serverless functions.

## API

### `GET /api/health`

Returns the service status and server time.

### `GET /api/state`

Returns the synchronized public operations state:

- release countdown
- empire balance and PnL history
- current mission
- six agent motion plans
- active handoffs
- business portfolio
- public activity feed

## PROJECT STRUCTURE

```text
.
|-- api/
|   |-- health.js
|   `-- state.js
|-- assets/
|   `-- favicon.svg
|-- scripts/
|   `-- check.js
|-- src/
|   `-- engine.js
|-- app.js
|-- index.html
|-- server.js
|-- styles.css
`-- vercel.json
```

## NOTE

This is an independent creative software project. It is not affiliated with or endorsed by Rockstar Games or Take-Two Interactive, and it does not include proprietary game assets. The release countdown is based on the [official GTA VI release date](https://www.rockstargames.com/VI).

Built by [@monokern](https://x.com/monokern).
