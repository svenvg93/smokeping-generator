# SmokePing Generator

A browser-based visual editor for generating [SmokePing](https://oss.oetiker.ch/smokeping/) configuration files. Build your probe and target hierarchy interactively, then copy the generated config directly into your SmokePing setup.

**Live app:** [svenvg93.github.io/smokeping-generator](https://svenvg93.github.io/smokeping-generator)

## Features

- **Visual target tree** — build a Section → Group → Target hierarchy with drag-and-drop reordering
- **Dual-stack support** — configure separate IPv4 and IPv6 hosts per target or group, with optional combined charts
- **Probe management** — define multiple probe types (FPing, DNS, HTTP, Curl, TCPPing, and more) with custom binaries and extra fields
- **Import** — load an existing SmokePing file to continue editing
- **Live preview** — the Configuration tab updates in real time as you make changes
- **Persisted state** — configuration is saved to `localStorage` and survives page reloads

## Usage

1. Open the app and configure your **Global Settings** (default probe, menu label, title)
2. Switch to the **Probes** tab to define your probe types
3. Switch to the **Targets** tab to build your target hierarchy
4. Switch to the **Configuration** tab to copy the generated SmokePing config

### Importing an existing config

Click the upload icon in the top-left of the Targets tree to import a SmokePing file. The app will parse it and populate the editor. To export, use the **Copy** button in the Configuration tab.

## Development

```bash
npm install
npm run dev
```

Requires Node.js 18+. Built with React 19, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

## Deployment

The app deploys automatically to GitHub Pages on every push to `master` via GitHub Actions.

```bash
npm run build   # outputs to dist/
```
