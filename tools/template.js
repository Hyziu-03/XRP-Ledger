"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("./server.js");
} else {
	console.log("This script can only be run in Node.js as a module");
}

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
