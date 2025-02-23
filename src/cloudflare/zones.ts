import { Cloudflare } from "cloudflare"

export async function listZones(env: Env) {
	const client = new Cloudflare({
		apiKey: env.CLOUDFLARE_API_KEY,
		apiEmail: env.CLOUDFLARE_API_EMAIL
	})

	const response = await client.zones.list()

	// Format the zones into a readable text response
	const zones = response.result || []
	const zonesList = zones
		.map((zone) => `- ${zone.name} (ID: ${zone.id})`)
		.join("\n")

	return {
		content: [
			{
				type: "text",
				text:
					zones.length > 0
						? `Found ${zones.length} zone(s):\n${zonesList}`
						: "No zones found."
			}
		]
	}
}
