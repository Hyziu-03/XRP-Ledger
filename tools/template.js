const xrpl = require("xrpl");
const server = require("./server.js");

async function main() {
	const client = new xrpl.Client(server);
	console.log("Connecting to testnet...");
	await client.connect();

	// ...

	console.log("Disconnecting from testnet...");
	client.disconnect();
}

main();
