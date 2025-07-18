"use strict";

if (typeof module !== "undefined") {
	var xrpl = require("xrpl");
} else {
	console.info(
		"This script can only be run in Node.js as a module"
	);
}
export function initTransactionSettings(
	coldWallet: any,
	hotWallet: any
): any {
	return {
		coldWallet: {
			TransactionType: "AccountSet",
			Account: coldWallet.address,
			TransferRate: 0,
			TickSize: 5,
			Domain: "6578616D706C652E636F6D",
			SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
			Flags:
				xrpl.AccountSetTfFlags.tfDisallowXRP |
				xrpl.AccountSetTfFlags.tfRequireDestTag,
		},
		hotWallet: {
			TransactionType: "AccountSet",
			Account: hotWallet.address,
			Domain: "6578616D706C652E636F6D",
			SetFlag: xrpl.AccountSetAsfFlags.asfRequireAuth,
			Flags:
				xrpl.AccountSetTfFlags.tfDisallowXRP |
				xrpl.AccountSetTfFlags.tfRequireDestTag,
		},
		trustLine: {
			TransactionType: "TrustSet",
			Account: hotWallet.address,
			LimitAmount: {
				currency: "FOO",
				issuer: coldWallet.address,
				value: "1000000000",
			},
		},
		sending: {
			TransactionType: "Payment",
			Account: coldWallet.address,
			Amount: {
				currency: "FOO",
				value: "3840",
				issuer: coldWallet.address,
			},
			Destination: hotWallet.address,
			DestinationTag: 1,
		},
	};
}
