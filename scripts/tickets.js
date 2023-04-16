// Tickets provide a way to send transactions out of the normal order

const xrpl = require("xrpl");
const server = require("../tools/server.js");
const { setupWallet } = require("../tools/helpers.js");

async function main() {
	const client = new xrpl.Client(server);
	console.log("Connecting to testnet...");
	await client.connect();

    const wallet = (await setupWallet(client)).wallet;
    const address = wallet.address;

    console.log("Requesting account information...");
	const accountInformation = await client.request({
        "command": "account_info",
        "account": address,
    });

    const currentSequence = accountInformation.result.account_data.Sequence;
    const preparedTransaction = await client.autofill({
        TransactionType: "TicketCreate",
        Account: address,
        TicketCount: 10,
        Sequence: currentSequence
    });

    const signedTransaction = wallet.sign(preparedTransaction);
    console.log(`Hash: ${signedTransaction.hash}`);

    console.log("Submitting transaction...");
    const transaction = await client.submitAndWait(signedTransaction.tx_blob);    
    console.log(`Transaction: ${JSON.stringify(transaction, null, 2)}`);

    console.log("Requesting account information...");
    const response = await client.request({
        "command": "account_objects",
        "account": address,
        "type": "ticket"
    });

    const availableTickets = response.result.account_objects;
    console.log(`Available tickets: ${availableTickets.length}`);
    const ticket = response.result.account_objects[0].TicketSequence;

    const finalTransaction = await client.autofill({
        TransactionType: "AccountSet",  
        Account: address,
        TicketSequence: ticket,
        LastLedgerSequence: null,
        Sequence: 0
    });

    const signedFinalTransaction = wallet.sign(finalTransaction);
    console.log(`Hash: ${signedFinalTransaction.hash}`);

    console.log("Submitting ticketed transaction...");
    const transactionBlob = signedFinalTransaction.tx_blob;
    const ticketedTransaction = await client.submitAndWait(transactionBlob);
    console.log(
        `Ticketed transaction: ${JSON.stringify(ticketedTransaction, null, 2)}`
    );

	console.log("Disconnecting from testnet...");
	client.disconnect();
}

main();
