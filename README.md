<div align="center">
  <img src="UOL_Logo.png" width="300">
</div>

# **Crosswire, Smart Home User Interfaces**
 
[Crosswire](https://github.com/oldenburghci/Crosswire-MQTT-Interceptor) is an open-source toolkit for systematically inducing failures in operational smart home environments. It operates as a transparent MQTT proxy between connected devices and a Home Assistant hub, intercepting the message flow that constitutes the system's observable behaviour — without modifying device firmware or hub configuration.
 
During the studies shown in the Crosswire paper, participants had to troubleshoot faulty and/or misbehaving smart home devices and tell us which device(s) in particular was misbehaving and what a potential cause could be. To aid the participants in their troubleshooting efforts different user interfaces where developed, which borrowed from already established features in their design-philosophy. 

The 2025 designs were inspired by already existing smart home interfaces like [Samsung SmartThings](https://www.samsung.com/us/smartthings/) with the goal being to try to find out any preferences among the participants and distill these into a new user interface which learned from the mistakes its predecessor made. Here, three different designed were ultilized. Dashboard, dashboard with tooltips, and floormap. The 2026 designs learned from feedback received in the 2025 study and were designed together with an UI expert. The tooltips were abolished and only the dashboard and floormap designs remained to further verify them.

The tech stack for these interfaces were React, Typescript, and Vite to allow instant changes on the interfaces without having to re-deploy or reload the interface.

## How it works

The application acts as the user-facing interface for a Home Assistant-based smart-home environment.

It communicates with Home Assistant through its REST API and WebSocket interface. Device states are retrieved from Home Assistant and updated in the interface, while selected activity and automation information can be displayed in near real time.

The 2025 UIs contain three UI variants:

- **Dashboard UI** — presents smart-home devices and their controls in a conventional tile-based interface.
- **Dashboard UI with Tooltips** — presents devices and rules together with contextual information about the user's room and the smart-home environment in the form of tooltips. This UI also features network graphs to further increase information about relationships between certain devices or automations.
- **Floormap UI** — provides a graphical representation of the room and the relationships between devices, connections, and dependencies with the help of an interactive floormap.

The refined 2026 UIs contain two UI variants:

- **Dashboard UI** - presents smart-home devices and their controls in a modern tile-based interface. This iteration also allows you to filter devices, only showing selected device groups while hiding others.
- **Floormap UI** - provides a graphical representation of the room and the relationships between devices, connections, and dependencies with the help of an interactive floormap. Sensor devices now send out a visible pulse every few seconds, showing that they are functional.

The refined UIs from 2026 also now allow you see the relationships between devices and automations more easily and from more pages, reducing the need to go back and forth between pages to help lessen the cognitive load for participants while troubleshooting.

## Main functionality

The interfaces contain components for a range of smart-home functions, including:

- Lighting
- Heating and climate control
- Smart fans
- Curtains and roller shades
- Television and media devices
- Smart sockets
- Door and window sensors
- Presence sensors
- Temperature sensors
- Device overviews
- Home Assistant automations and rules
- Room/floor-map visualisation
- Device connections and dependencies
- Activity recording and logbook information
- Clock and experiment-related information

## Home Assistant integration

The frontend expects Home Assistant to be available at:

```text
http://localhost:8123
```

During local development, Vite proxies requests beginning with `/api` to Home Assistant:

```text
/api -> http://localhost:8123
```

The application uses Home Assistant endpoints to:

- Retrieve entity states
- Retrieve logbook entries
- Retrieve automation information
- Retrieve automation configurations
- Send or interact with Home Assistant data
- Subscribe to real-time `state_changed`, `call_service`, and `automation_triggered` events through the Home Assistant WebSocket API

## Requirements

For local development, the project requires:

- Node.js
- npm
- A running Home Assistant instance
- Home Assistant API access
- The smart-home entities expected by the application
- Optionally, the backend service used for `/api/zigbee-network-graph`

The project uses:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Material UI
- Axios
- Konva / React Konva
- Vis Network
- React Force Graph
- Home Assistant JavaScript WebSocket support

## **License & Citation**

Crosswire, as well as the user interfaces used during the studies, are released under the **Apache 2.0 License**. If you use these user interfaces in your work, we kindly ask you to **cite the original paper** and/or **link to this repository** to support its development and visibility. 

This repository will be maintained as a part of the ongoing research project, managed by Carl von Ossietzky Universität Oldenburg. For any alterations or additions to the interceptor, please either implement them yourself or fork this repository to add your changes, so others can benefit.

Should you have any questions, you're welcome to contact our current project lead: 

(June 2026 -- current) Mikołaj P. Woźniak, mikolaj.wozniak@uni-oldenburg.de
