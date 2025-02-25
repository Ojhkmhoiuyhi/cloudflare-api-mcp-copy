import { WorkerEntrypoint } from "cloudflare:workers"
import { ProxyToSelf } from "workers-mcp"
import { purgeEverything } from "./cloudflare/cache"
import {
	createDNSRecord,
	deleteDNSRecord,
	editDNSRecord,
	listDNSRecords
} from "./cloudflare/dns"
import {
	createHyperdriveConfig,
	deleteHyperdriveConfig,
	editHyperdriveConfig,
	getHyperdriveConfig,
	listHyperdriveConfigs
} from "./cloudflare/hyperdrive"
import {
	createNamespace,
	deleteNamespace,
	deleteValue,
	getMetadata,
	getNamespace,
	getValue,
	listKeys,
	listNamespaces,
	updateNamespace,
	updateValue
} from "./cloudflare/kv"
import { listZones } from "./cloudflare/zones"
import type { DNSRecordType } from "./types"

export default class MyWorker extends WorkerEntrypoint<Env> {
	/**
	 * @ignore
	 */
	async fetch(request: Request): Promise<Response> {
		return new ProxyToSelf(this).fetch(request)
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
	 * Create a new Hyperdrive configuration.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param name {string} The name for the new Hyperdrive configuration.
	 * @param originType {string} The type of origin ("standard" or "access").
	 * @param database {string} The name of your origin database.
	 * @param host {string} The host (hostname or IP) of your origin database.
	 * @param password {string} The password required to access your origin database.
	 * @param port {number} The port of your origin database.
	 * @param scheme {string} The URL scheme used to connect to your origin database.
	 * @param user {string} The user of your origin database.
	 * @param accessClientId {string} The Client ID of the Access token (required if originType is "access").
	 * @param accessClientSecret {string} The Client Secret of the Access token (required if originType is "access").
	 * @param cachingDisabled {boolean} When true, disables caching of SQL responses.
	 * @param cachingMaxAge {number} Optional max duration for which items should persist in cache.
	 * @param cachingStaleWhileRevalidate {number} Optional duration cache may serve stale responses.
	 * @return {Promise<any>} The created Hyperdrive configuration.
	 */
	async createHyperdriveConfig(
		accountId: string,
		name: string,
		originType: string,
		database: string,
		host: string,
		password: string,
		port: number,
		scheme: string,
		user: string,
		accessClientId?: string,
		accessClientSecret?: string,
		cachingDisabled?: boolean,
		cachingMaxAge?: number,
		cachingStaleWhileRevalidate?: number
	) {
		type StandardOrigin = {
			database: string
			host: string
			password: string
			port: number
			scheme: "postgres" | "postgresql"
			user: string
		}

		type AccessOrigin = {
			access_client_id: string
			access_client_secret: string
			database: string
			host: string
			password: string
			scheme: "postgres" | "postgresql"
			user: string
		}

		let origin: StandardOrigin | AccessOrigin
		if (originType === "access" && accessClientId && accessClientSecret) {
			// Origin for Access-protected database
			origin = {
				access_client_id: accessClientId,
				access_client_secret: accessClientSecret,
				database,
				host,
				password,
				scheme: scheme as "postgres" | "postgresql",
				user
			}
		} else {
			// Standard origin
			origin = {
				database,
				host,
				password,
				port,
				scheme: scheme as "postgres" | "postgresql",
				user
			}
		}

		const caching =
			cachingDisabled !== undefined ||
			cachingMaxAge !== undefined ||
			cachingStaleWhileRevalidate !== undefined
				? {
						disabled: cachingDisabled,
						max_age: cachingMaxAge,
						stale_while_revalidate: cachingStaleWhileRevalidate
					}
				: undefined

		return await createHyperdriveConfig(
			this.env,
			accountId,
			name,
			origin,
			caching
		)
	}

	/**
	 * Delete a Hyperdrive configuration.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param hyperdriveId {string} The ID of the Hyperdrive configuration to delete.
	 * @return {Promise<any>} Response from the delete operation.
	 */
	async deleteHyperdriveConfig(accountId: string, hyperdriveId: string) {
		return await deleteHyperdriveConfig(this.env, accountId, hyperdriveId)
	}

	/**
	 * Edit a Hyperdrive configuration.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param hyperdriveId {string} The ID of the Hyperdrive configuration to edit.
	 * @param name {string} Optional new name for the Hyperdrive configuration.
	 * @param cachingDisabled {boolean} Optional when true, disables caching of SQL responses.
	 * @param cachingMaxAge {number} Optional max duration for which items should persist in cache.
	 * @param cachingStaleWhileRevalidate {number} Optional duration cache may serve stale responses.
	 * @return {Promise<any>} The updated Hyperdrive configuration.
	 */
	async editHyperdriveConfig(
		accountId: string,
		hyperdriveId: string,
		name?: string,
		cachingDisabled?: boolean,
		cachingMaxAge?: number,
		cachingStaleWhileRevalidate?: number
	) {
		const params: {
			name?: string
			caching?: {
				disabled?: boolean
				max_age?: number
				stale_while_revalidate?: number
			}
		} = {}

		if (name !== undefined) {
			params.name = name
		}

		if (
			cachingDisabled !== undefined ||
			cachingMaxAge !== undefined ||
			cachingStaleWhileRevalidate !== undefined
		) {
			params.caching = {
				disabled: cachingDisabled,
				max_age: cachingMaxAge,
				stale_while_revalidate: cachingStaleWhileRevalidate
			}
		}

		return await editHyperdriveConfig(
			this.env,
			accountId,
			hyperdriveId,
			params
		)
	}

	/**
	 * Get a Hyperdrive configuration.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param hyperdriveId {string} The ID of the Hyperdrive configuration to retrieve.
	 * @return {Promise<any>} The Hyperdrive configuration.
	 */
	async getHyperdriveConfig(accountId: string, hyperdriveId: string) {
		return await getHyperdriveConfig(this.env, accountId, hyperdriveId)
	}

	/**
	 * List all Hyperdrive configurations in an account.
	 * @param accountId {string} The Cloudflare account ID.
	 * @return {Promise<any>} List of Hyperdrive configurations.
	 */
	async listHyperdriveConfigs(accountId: string) {
		return await listHyperdriveConfigs(this.env, accountId)
	}

	/**
	 * Create a KV namespace.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param title {string} A human-readable string name for a Namespace.
	 * @return {Promise<any>} The created namespace.
	 */
	async createKVNamespace(accountId: string, title: string) {
		return await createNamespace(this.env, accountId, title)
	}

	/**
	 * Update a KV namespace title.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param namespaceId {string} The ID of the namespace to update.
	 * @param title {string} New human-readable string name for the Namespace.
	 * @return {Promise<any>} Response from the update operation.
	 */
	async updateKVNamespace(
		accountId: string,
		namespaceId: string,
		title: string
	) {
		return await updateNamespace(this.env, accountId, namespaceId, title)
	}

	/**
	 * List KV namespaces for an account.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param order {string} Optional field to order results by: 'id' or 'title'.
	 * @param direction {string} Optional direction to order namespaces: 'asc' or 'desc'.
	 * @return {Promise<any>} List of namespaces.
	 */
	async listKVNamespaces(
		accountId: string,
		order?: "id" | "title",
		direction?: "asc" | "desc"
	) {
		return await listNamespaces(this.env, accountId, order, direction)
	}

	/**
	 * Delete a KV namespace.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param namespaceId {string} The ID of the namespace to delete.
	 * @return {Promise<any>} Response from the delete operation.
	 */
	async deleteKVNamespace(accountId: string, namespaceId: string) {
		return await deleteNamespace(this.env, accountId, namespaceId)
	}

	/**
	 * Get a specific KV namespace.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param namespaceId {string} The ID of the namespace to retrieve.
	 * @return {Promise<any>} The namespace details.
	 */
	async getKVNamespace(accountId: string, namespaceId: string) {
		return await getNamespace(this.env, accountId, namespaceId)
	}

	/**
	 * List keys in a KV namespace.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param namespaceId {string} The ID of the namespace.
	 * @param prefix {string} Optional string prefix to filter key names.
	 * @param cursor {string} Optional cursor for pagination.
	 * @param limit {number} Optional limit on number of keys to return.
	 * @return {Promise<any>} List of keys.
	 */
	async listKVKeys(
		accountId: string,
		namespaceId: string,
		prefix?: string,
		cursor?: string,
		limit?: number
	) {
		return await listKeys(
			this.env,
			accountId,
			namespaceId,
			prefix,
			cursor,
			limit
		)
	}

	/**
	 * Get metadata for a key in a KV namespace.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param namespaceId {string} The ID of the namespace.
	 * @param keyName {string} The name of the key.
	 * @return {Promise<any>} The metadata for the key.
	 */
	async getKVMetadata(
		accountId: string,
		namespaceId: string,
		keyName: string
	) {
		return await getMetadata(this.env, accountId, namespaceId, keyName)
	}

	/**
	 * Update a value in a KV namespace.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param namespaceId {string} The ID of the namespace.
	 * @param keyName {string} The name of the key.
	 * @param value {string} The value to store.
	 * @param metadata {string} Optional JSON metadata to associate with the key/value pair.
	 * @param expiration {number} Optional time at which the key should expire.
	 * @param expiration_ttl {number} Optional time-to-live in seconds for the key.
	 * @return {Promise<any>} Response from the update operation.
	 */
	async updateKVValue(
		accountId: string,
		namespaceId: string,
		keyName: string,
		value: string,
		metadata?: string,
		expiration?: number,
		expiration_ttl?: number
	) {
		return await updateValue(
			this.env,
			accountId,
			namespaceId,
			keyName,
			value,
			metadata,
			expiration,
			expiration_ttl
		)
	}

	/**
	 * Delete a value from a KV namespace.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param namespaceId {string} The ID of the namespace.
	 * @param keyName {string} The name of the key to delete.
	 * @return {Promise<any>} Response from the delete operation.
	 */
	async deleteKVValue(
		accountId: string,
		namespaceId: string,
		keyName: string
	) {
		return await deleteValue(this.env, accountId, namespaceId, keyName)
	}

	/**
	 * Get a value from a KV namespace.
	 * @param accountId {string} The Cloudflare account ID.
	 * @param namespaceId {string} The ID of the namespace.
	 * @param keyName {string} The name of the key to retrieve.
	 * @return {Promise<any>} The value associated with the key.
	 */
	async getKVValue(accountId: string, namespaceId: string, keyName: string) {
		return await getValue(this.env, accountId, namespaceId, keyName)
	}
}
