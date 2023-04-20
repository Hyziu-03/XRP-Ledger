const xrpl = require("xrpl");

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

module.exports = {
	setupWallet,
};
