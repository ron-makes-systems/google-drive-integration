# Fibery Connector Template

A template for building custom Fibery integrations using AI coding agents. This enables continuous **one-way sync** of data from external apps into Fibery.

## Why Use This?

Fibery integrations replicate part of an external app's domain model, creating Databases in Fibery from external data. While dozens of integrations are already available as built-in templates in Fibery, you may need a custom integration for a service not yet supported.

This template, combined with AI coding agents, dramatically speeds up the development of custom integrations.

## Prerequisites

- Node.js ^25.2.1
- pnpm 10.24.0
- An AI coding agent (e.g., Claude Code with Opus 4.5)
- ngrok (for local testing)

## Local Testing

1. Start your integration server:
   ```bash
   pnpm start
   ```

2. Expose it via ngrok:
   ```bash
   ngrok http <your-port>
   ```

3. In your Fibery workspace, go to integrations and add a **Custom Integration** using the ngrok URL.