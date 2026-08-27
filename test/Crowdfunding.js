const { expect } = require("chai");
const { ethers } = require("hardhat");
const {time} = require("@nomicfoundation/hardhat-network-helpers");

describe("Crowdfunding", function () {
    let crowdfunding, creator, person1, person2;
    const GOAL = ethers.parseEther("10");
    const DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

    beforeEach(async function () {
        [creator, person1, person2] = await ethers.getSigners();
        const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
        crowdfunding = await Crowdfunding.deploy();
        await crowdfunding.connect(creator).createCampaign(GOAL, DURATION);
    });

    it("registra correttamente un contributo", async function () {
        await crowdfunding.connect(person1).contribute(0, {value: ethers.parseEther("3")});
        const c = await crowdfunding.campaigns(0);
        expect(c.raised).to.equal(ethers.parseEther("3"));
        expect(await crowdfunding.contributions(0, person1.address)).to.equal(ethers.parseEther("3"));
    });

    it("obiettivo raggiunto e prelievo del creatore", async function () {
        await crowdfunding.connect(person1).contribute(0, {value: ethers.parseEther("6")});
        await crowdfunding.connect(person2).contribute(0, {value: ethers.parseEther("5")});
        
        await time.increase(DURATION + 1); // Avanza il tempo oltre la durata della campagna

        await expect(crowdfunding.connect(creator).withdraw(0)).to.changeEtherBalance(creator, ethers.parseEther("11"));
        const c = await crowdfunding.campaigns(0);
        expect(c[4]).to.equal(true);
    });

    it("obiettivo non raggiunto e rimborso dei contributori", async function () {
        await crowdfunding.connect(person1).contribute(0, {value: ethers.parseEther("3")});
        await crowdfunding.connect(person2).contribute(0, {value: ethers.parseEther("4")});

        await time.increase(DURATION + 1); 

        await expect(crowdfunding.connect(person1).refund(0)).to.changeEtherBalance(person1, ethers.parseEther("3"));
        await expect(crowdfunding.connect(person2).refund(0)).to.changeEtherBalance(person2, ethers.parseEther("4"));
    
        await expect(crowdfunding.connect(person1).refund(0)).to.be.revertedWith("Nessun contributo da rimborsare");
    });

    it("solo il creatore puo prelevare fondi", async function(){
        await crowdfunding.connect(person1).contribute(0, {value: ethers.parseEther("11")});
        await time.increase(DURATION + 1);
        await expect(crowdfunding.connect(person1).withdraw(0)).to.be.revertedWith("Solo il creatore puo ritirare i fondi");
    });

    it("non si puo prelevare prima della scadenza", async function(){
        await crowdfunding.connect(person1).contribute(0, {value: ethers.parseEther("11")});
        await expect(crowdfunding.connect(creator).withdraw(0)).to.be.revertedWith("Campagna ancora attiva");
    });

    it("non si puo contribuire dopo la scadenza", async function(){
        await crowdfunding.connect(person1).contribute(0, {value: ethers.parseEther("5")});
        await time.increase(DURATION + 1);
        await expect(crowdfunding.connect(person2).contribute(0, {value: ethers.parseEther("5")})).to.be.revertedWith("Campagna scaduta");
    });   

});