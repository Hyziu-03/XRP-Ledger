"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var { serverURL } = require("./tools/server.ts");

	try {
		main();
	} catch (error) {
		console.error("There was en error in the main function ❌");
		throw new Error(error);
	}
} else
	console.info(
		"This script can only be run in Node.js as a module"
	);

async function main() {
	const client = new xrpl.Client(serverURL);
	console.info("Connecting to testnet...");
	await client.connect();

	// ...

	console.info("Disconnecting from testnet...");
	client.disconnect();
}
