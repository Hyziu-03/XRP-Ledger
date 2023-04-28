// Fix Error: connect() timed out after 10000 ms.
// Tickets provide a way to send transactions out of the normal order

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
	var server = require("../tools/server.js");
	var { setupWallet, submitTransaction } = require("../tools/helpers.js");
} else {
	console.log("This script can only be run in Node.js as a module");
}

async function main() {
	try {
		const client = new xrpl.Client(server);
		console.log("Connecting to testnet...");
		await client.connect();

		const { wallet, address } = (await setupWallet(client));
		console.log("Requesting account information...");
		const accountInformation = await client.request({
			command: "account_info",
			account: address,
		});

		const currentSequence = accountInformation.result.account_data.Sequence;
		const preparedTransaction = await client.autofill({
			TransactionType: "TicketCreate",
			Account: address,
			TicketCount: 10,
			Sequence: currentSequence,
		});

		const signedTransaction = wallet.sign(preparedTransaction);
		console.log(`Hash: ${signedTransaction.hash}`);
		submitTransaction(client, signedTransaction.tx_blob);

		console.log("Requesting account information...");
		const response = await client.request({
			command: "account_objects",
			account: address,
			type: "ticket",
		});

		const availableTickets = response.result.account_objects;
		console.log(`Available tickets: ${availableTickets.length}`);
		
		if(availableTickets.length > 0) {
			const ticket =
				response.result.account_objects[0].TicketSequence;

			const finalTransaction = await client.autofill({
				TransactionType: "AccountSet",
				Account: address,
				TicketSequence: ticket,
				LastLedgerSequence: null,
				Sequence: 0,
			});

			const signedFinalTransaction =
				wallet.sign(finalTransaction);
			console.log(`Hash: ${signedFinalTransaction.hash}`);
			submitTransaction(client, signedFinalTransaction.tx_blob);
		} else {
			console.log("No tickets available.");
		}

		console.log("Disconnecting from testnet...");
		client.disconnect();
	} catch (error) {
		console.error(
			"There was an error ticketing the transaction ❌"
		);
		throw new Error(error);
	}
}

main();
