const xrpl = require("xrpl");
const server = require("./server.js");

async function main() {
	try {
		const client = new xrpl.Client(server);
		console.log("Connecting to testnet...");
		await client.connect();

		// ...

		console.log("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error("There was en error in the main function ❌");
		throw new Error(error);
	}
}

main();
