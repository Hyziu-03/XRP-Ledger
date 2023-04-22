// Make an optional parameter describing what is happening for every function

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
} else {
	console.log("This script can only be run in Node.js as a module");
}

async function setupWallet(client) {
	try {
		const funding = await client.fundWallet();
		console.log("Funded a wallet");
		const { wallet, balance } = funding;
		const { publicKey, privateKey, classicAddress, seed } = wallet;

		console.log(`Balance: ${balance} XRP`);
		console.log("Public Key: ", publicKey);
		console.log("Private Key: ", privateKey);
		console.log("Address: ", classicAddress);
		console.log("Seed: ", seed);

		console.log("Funding a wallet...");
		return {
			wallet: wallet,
			balance: balance,
			publicKey: publicKey,
			privateKey: privateKey,
			address: classicAddress,
			seed: seed,
		};
	} catch (error) {
		console.error("There was an error funding the wallet ❌");
		throw new Error(error);
	}
}

async function submitTransaction(blob) {
	console.log("Submitting transaction...");
	const transaction = await client.submitAndWait(blob);
	return transaction.result.meta.TransactionResult;
}

module.exports = {
	setupWallet,
	submitTransaction,
};
