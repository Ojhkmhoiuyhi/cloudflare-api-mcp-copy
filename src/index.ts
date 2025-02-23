import { WorkerEntrypoint } from "cloudflare:workers"
import { ProxyToSelf } from "workers-mcp"
import { purgeEverything } from "./cloudflare/cache"
import {
	createDNSRecord,
	deleteDNSRecord,
	editDNSRecord,
	listDNSRecords
} from "./cloudflare/dns"
import { listZones } from "./cloudflare/zones"
import type { DNSRecordType } from "./types"

export default class MyWorker extends WorkerEntrypoint<Env> {
	/**
	 * A warm, friendly greeting from your new Workers MCP server.
	 * @param name {string} the name of the person we are greeting.
	 * @return {string} the contents of our greeting.
	 */
	sayHello(name: string) {
		return `Hello from an MCP Worker, ${name}!`
	}

	/**
	 * List all Cloudflare zones for the account.
	 * @return {Promise<any>} List of zones.
	 */
	async listZones() {
		return await listZones(this.env)
	}

	/**
	 * Purge everything from Cloudflare's cache for a zone.
	 * @param zoneId {string} The ID of the zone to purge cache for.
	 * @return {Promise<any>} Response from the purge operation.
	 */
	async purgeCache(zoneId: string) {
		return await purgeEverything(this.env, zoneId)
	}

	/**
	 * Create a new DNS record.
	 * @param zoneId {string} The ID of the zone to create the record in.
	 * @param name {string} The name of the DNS record.
	 * @param content {string} The content of the DNS record.
	 * @param type {string} The type of DNS record (CNAME, A, TXT, or MX).
	 * @param comment {string} Optional comment for the DNS record.
	 * @param proxied {boolean} Optional whether to proxy the record through Cloudflare.
	 * @return {Promise<any>} The created DNS record.
	 */
	async createDNSRecord(
		zoneId: string,
		name: string,
		content: string,
		type: string,
		comment?: string,
		proxied?: boolean
	) {
		return await createDNSRecord(
			this.env,
			zoneId,
			name,
			content,
			type as DNSRecordType,
			comment,
			proxied
		)
	}

	/**
	 * Delete a DNS record.
	 * @param zoneId {string} The ID of the zone containing the record.
	 * @param recordId {string} The ID of the DNS record to delete.
	 * @return {Promise<any>} Response from the delete operation.
	 */
	async deleteDNSRecord(zoneId: string, recordId: string) {
		return await deleteDNSRecord(this.env, zoneId, recordId)
	}

	/**
	 * Edit an existing DNS record.
	 * @param zoneId {string} The ID of the zone containing the record.
	 * @param recordId {string} The ID of the DNS record to edit.
	 * @param content {string} The new content for the DNS record.
	 * @param type {string} The type of DNS record (CNAME, A, TXT, or MX).
	 * @param comment {string} Optional comment for the DNS record.
	 * @param proxied {boolean} Optional whether to proxy the record through Cloudflare.
	 * @return {Promise<any>} The updated DNS record.
	 */
	async editDNSRecord(
		zoneId: string,
		recordId: string,
		content: string,
		type: string,
		comment?: string,
		proxied?: boolean
	) {
		return await editDNSRecord(
			this.env,
			zoneId,
			recordId,
			content,
			type as DNSRecordType,
			comment,
			proxied
		)
	}

	/**
	 * List all DNS records for a zone.
	 * @param zoneId {string} The ID of the zone to list records for.
	 * @return {Promise<any>} List of DNS records.
	 */
	async listDNSRecords(zoneId: string) {
		return await listDNSRecords(this.env, zoneId)
	}

	/**
	 * @ignore
	 */
	async fetch(request: Request): Promise<Response> {
		return new ProxyToSelf(this).fetch(request)
	}
}
