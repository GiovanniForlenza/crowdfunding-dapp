const { ethers } = require("hardhat");

async function main() {
    const Factory = await ethers.getContractFactory("Crowdfunding");
    const crowdfunding = await Factory.deploy();
    await crowdfunding.waitForDeployment();

    const address = await crowdfunding.getAddress();
    console.log("Crowdfunding contract deployed to:", address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
