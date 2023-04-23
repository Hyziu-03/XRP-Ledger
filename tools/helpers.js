if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
} else {
	console.log("This script can only be run in Node.js as a module");
}

async function setupWallet(client, describe = false) {
	try {
		const funding = await client.fundWallet();
		if(describe) console.log("Funding a wallet...");

		const { wallet, balance } = funding;
		const { publicKey, privateKey, classicAddress, seed } =
			wallet;

		if(describe) {
			console.log(`Balance: ${balance} XRP`);
			console.log("Public Key: ", publicKey);
			console.log("Private Key: ", privateKey);
			console.log("Address: ", classicAddress);
			console.log("Seed: ", seed);
			console.log("Funding a wallet...");
		}

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

async function submitTransaction(client, blob, describe = false) {
	try {
		if (describe) console.log("Submitting transaction...");
		const transaction = await client.submitAndWait(blob);
		return transaction.result.meta.TransactionResult;
	} catch (error) {
		console.error(
			"There was an error submitting the transaction ❌"
		);
		throw new Error(error);
	}
}

function handleResult(result) {
	try {
		if (result === "tesSUCCESS") {
			console.log("Transaction successful ✅");
		} else {
			console.log(`Result: ${result}`);
			console.error("Transaction failed ❌");
		}
	} catch (error) {
		console.error(
			"There was an error handling the transaction result ❌"
		);
		throw new Error(error);
	}
}

module.exports = {
	setupWallet,
	submitTransaction,
	handleResult,
};

// [x] Line do not wrap 
// [x] There are at maximum 3 levels of indentation 
