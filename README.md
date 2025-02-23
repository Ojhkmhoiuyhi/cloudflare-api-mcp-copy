# cloudflare-api-mcp

A lightweight [Model Control Protocol (MCP)](https://modelcontextprotocol.io) server deployed on [Cloudflare Workers](https://workers.cloudflare.com) that interfaces with the [Cloudflare REST API](https://developers.cloudflare.com/api/).

This is a simple example of an MCP server made with the [create-mcp](https://github.com/zueai/create-mcp) CLI.

It's still under development, I will be adding more tools as I find myself needing them.

## Getting Started

Run the automated setup script to clone the worker and deploy it to your Cloudflare account:

```bash
bun create mcp cloudflare-api-mcp --clone https://github.com/amxv/cloudflare-api-mcp
```

Upload your Cloudflare API key and email to your worker secrets:

```bash
wrangler secret put CLOUDFLARE_API_KEY
wrangler secret put CLOUDFLARE_API_EMAIL
```

Add it to Cursor by pasting the MCP server command that was copied to your clipboard during setup.

## Local Development

Add your Cloudflare API key and email to the `.dev.vars` file:

```bash
CLOUDFLARE_API_KEY=<your-cloudflare-api-key>
CLOUDFLARE_API_EMAIL=<your-cloudflare-api-email>
```

Run the development server:

```bash
bun dev
```

## Deploying

Deploy the worker to Cloudflare:

```bash
bun run deploy
```

Reload your Cursor window to see the new tools.

## How to Create New MCP Tools

To create new MCP tools, add methods to the `MyWorker` class in `src/index.ts`. Each function will automatically become an MCP tool that your agent can use.

Example:

```typescript
/**
 * Create a new DNS record in a zone.
 * @param zoneId {string} The ID of the zone to create the record in.
 * @param name {string} The name of the DNS record.
 * @param content {string} The content of the DNS record.
 * @param type {string} The type of DNS record (CNAME, A, TXT, or MX).
 * @param comment {string} Optional comment for the DNS record.
 * @param proxied {boolean} Optional whether to proxy the record through Cloudflare.
 * @return {object} The created DNS record.
 */
createDNSRecord(zoneId: string, name: string, content: string, type: string, comment?: string, proxied?: boolean) {
    // Implementation
}
```

The JSDoc comments are important:

- First line becomes the tool's description
- `@param` tags define the tool's parameters with types and descriptions
- `@return` tag specifies the return value and type

## Available Tools

The server currently provides tools for:

- Managing DNS records
- Purging cache
- Listing zones
- More coming soon. Specifically, Workers, R2, KV, Queues, and Hyperdrive.

You can see all the tools in the `src/index.ts` file. The functions are in `src/cloudflare/`.

## Learn More

- [Model Control Protocol Documentation](https://modelcontextprotocol.io)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)
- [create-mcp Documentation](https://github.com/zueai/create-mcp)
- [workers-mcp](https://github.com/zueai/workers-mcp)
