const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Bets = artifacts.require('./Bets.sol');

var Promise = require("bluebird");

contract('Bets', function(accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    const asserts = Asserts(assert);
    const OWNER = accounts[0];
    let bets;

    before('setup', () => {
        return Bets.deployed()
        .then(instance => bets = instance)
        .then(reverter.snapshot);
    });

    it('should place bets from all accounts using promise.each', () => {
        const accountsNotOwner = accounts.slice(1);
        return Promise.resolve()
        .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
        .then(() => Promise.each(accountsNotOwner,(account) => {
            bets.placeBet(0, 0,  {from: account, value:100});
        }))
        .then(() => bets.checkBalance({from: OWNER}))
        .then(asserts.equal(10000));
    });

    it('should place bets for 2 games and resolve games: 1 - case A wins, 2 - draw', () => {
        const bettors1A = accounts.slice(1, 26);
        const bettors1B = accounts.slice(26, 51);
        const bettors2A = accounts.slice(51, 76);
        const bettors2B = accounts.slice(76);
        const amount = 100;
        const gasPrice = 100000000000;
        var gasCount = 0;
        var indexArray25 = new Array();
        for(var i=0; i < 25; i++) {
            indexArray25[i] = i;
        }
        var indexArray50 = new Array();
        for(var i=0; i < 50; i++) {
            indexArray50[i] = i;
        }
        var balances_before = new Array(100);
        var balances_after = new Array(100);

        return Promise.resolve()
        .then(() => bets.createGame("New bet 1", "case 1A", "case 1B", 500, {from: OWNER}))
        .then((result) => gasCount += result.receipt.gasUsed)
        .then(() => bets.createGame("New bet 2", "case 2A", "case 2B", 500, {from: OWNER}))
        .then((result) => gasCount += result.receipt.gasUsed)

        .then(() => Promise.each(bettors1A,(account) =>
            bets.placeBet(0, 0,  {from: account, value:amount})
            .then((result) => gasCount += result.receipt.gasUsed)
        ))
        .then(() => Promise.each(bettors1B,(account) =>
            bets.placeBet(0, 1,  {from: account, value:amount})
            .then((result) => gasCount += result.receipt.gasUsed)
        ))
        .then(() => Promise.each(bettors2A,(account) =>
            bets.placeBet(1, 0,  {from: account, value:amount})
            .then((result) => gasCount += result.receipt.gasUsed)
        ))
        .then(() => Promise.each(bettors2B,(account) =>
            bets.placeBet(1, 1,  {from: account, value:amount})
            .then((result) => gasCount += result.receipt.gasUsed)
        ))
        .then(() => {
            for (var i=0;i<100;i++)
                balances_before[i] = web3.eth.getBalance(accounts[i+1]);
            for (var i=0;i<25;i++)
                balances_after[i] = balances_before[i].add(190);
            for (var i=25;i<50;i++)
                balances_after[i] = balances_before[i];
            for (var i=50;i<100;i++)
                balances_after[i] = balances_before[i].add(100);
        })
        .then(() => bets.checkBalance({from: OWNER}))
        .then(asserts.equal(10000))
        .then(() => bets.getNumBets0(0,{from: OWNER}))
        .then(asserts.equal(25))
        .then(() => bets.getNumBets1(0,{from: OWNER}))
        .then(asserts.equal(25))
        .then(() => bets.getNumBets0(1,{from: OWNER}))
        .then(asserts.equal(25))
        .then(() => bets.getNumBets1(1,{from: OWNER}))
        .then(asserts.equal(25))
        .then(() => bets.resolveGame(0, 0, {from: OWNER}))
        .then((result) => gasCount += result.receipt.gasUsed)
        .then(() => bets.endGameInADraw(1, {from: OWNER}))
        .then((result) => gasCount += result.receipt.gasUsed)
        .then(() => Promise.each(indexArray25,(ind) =>
            bets.claimPrize(0, ind,  {from: OWNER})
            .then((result) => gasCount += result.receipt.gasUsed)
            .then(() => assert.equal(web3.eth.getBalance(accounts[ind+1]).valueOf(),
                balances_after[ind].valueOf()))
            ))
        .then(() => bets.checkBalance())
        .then(asserts.equal(5000))
        .then(() => Promise.each(indexArray50,(ind) =>
            bets.claimPrize(1, ind,  {from: OWNER})
        .then((result) => gasCount += result.receipt.gasUsed)
        .then(() => assert.equal(web3.eth.getBalance(accounts[ind+1]).valueOf(),
            balances_after[ind].valueOf()))
        ))
        .then(() => {
            console.log("Gas used: ", gasCount);
            console.log("gasUsed*gasPrice: ", gasPrice*gasCount)
        })
    });
});
