const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const Bets = artifacts.require('./Bets.sol');

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

  it('should allow to see the number of the bettings', () => {
      return Promise.resolve()
      .then(() => bets.createGame("New bet", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.numGames())
      .then(asserts.equal(1));
  });

  it('should allow to see the descriptions of the betting', () => {
      const descr = "New bet";
      const caseA = "case A";
      const caseB = "case B";
      return Promise.resolve()
      .then(() => bets.createGame(descr, caseA, caseB, 100, {from: OWNER}))
      .then(() => bets.getDescription(0))
      .then(asserts.equal(descr))
      .then(() => bets.getDescr0(0))
      .then(asserts.equal(caseA))
      .then(() => bets.getDescr1(0))
      .then(asserts.equal(caseB));
  });

  it('should allow to place a bet on case A', () => {
      const bettor = accounts[1];
      const amount = 20;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettor, value:amount}))
      .then(() => bets.checkBalance({from: OWNER}))
      .then(asserts.equal(amount));
  });

  it('should allow to place a bet on case B', () => {
      const bettor = accounts[1];
      const amount = 20;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettor, value:amount}))
      .then(() => bets.checkBalance({from: OWNER}))
      .then(asserts.equal(amount));
  });

  it('should allow to place a bet on case A and transfer money', () => {
      const bettorA = accounts[1];
      const amount = 2000;
      var adminBefore = web3.eth.getBalance(OWNER).valueOf();
      var bettorA_before;
      var gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bettorA_before = web3.eth.getBalance(bettorA))
      .then(() => bets.placeBet(0, 0,  {from: bettorA, value:amount, gasPrice: gasPrice}))
      .then((result) => assert.equal(web3.eth.getBalance(bettorA).valueOf(),
      bettorA_before.sub(gasPrice.mul(result.receipt.gasUsed)).sub(amount).valueOf()));
  });

  it('should allow to resolve the game (case A wins)', () => {
      const bettorA = accounts[1];
      const bettorB = accounts[2];
      const amount = 2000;
      var adminBefore, bettorA_before;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA, value:amount}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB, value:amount}))
      .then(() =>  adminBefore = web3.eth.getBalance(OWNER))
      .then(() =>  bettorA_before = web3.eth.getBalance(bettorA))
      .then(() => bets.resolveGame(0, 0, {from: OWNER, gasPrice: gasPrice}))
      .then((result) => assert.equal(web3.eth.getBalance(OWNER).valueOf(),
            adminBefore.sub(gasPrice.mul(result.receipt.gasUsed)).add(200).valueOf()))
      .then(() => bets.claimPrize(0,0, {gasPrice: gasPrice}))
      .then(() => assert.equal(web3.eth.getBalance(bettorA).valueOf(),
            bettorA_before.add(3800).valueOf()));
  });

  it('should allow to resolve the game and share money (case B wins)', () => {
      const bettorA1 = accounts[1];
      const bettorA2 = accounts[2];
      const bettorB1 = accounts[3];
      const bettorB2 = accounts[4];
      const amount1 = 1500;
      const amount2 = 500;
      var adminBefore, bettorB1_before, bettorB2_before;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA1, value:amount1}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA2, value:amount2}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB1, value:amount1*2}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB2, value:amount2*2}))
      .then(() =>  adminBefore = web3.eth.getBalance(OWNER))
      .then(() =>  bettorB1_before = web3.eth.getBalance(bettorB1))
      .then(() =>  bettorB2_before = web3.eth.getBalance(bettorB2))
      .then(() => bets.resolveGame(0, 1, {from: OWNER, gasPrice: gasPrice}))
      .then((result) => assert.equal(web3.eth.getBalance(OWNER).valueOf(),
            adminBefore.sub(gasPrice.mul(result.receipt.gasUsed)).add(200).valueOf()))
      .then(() => bets.claimPrize(0,2, {from: OWNER, gasPrice: gasPrice}))
      .then(() => assert.equal(web3.eth.getBalance(bettorB1).valueOf(),
                    bettorB1_before.add(4350).valueOf()))
      .then(() => bets.claimPrize(0,3, {from: OWNER, gasPrice: gasPrice}))
      .then(() => assert.equal(web3.eth.getBalance(bettorB2).valueOf(),
                  bettorB2_before.add(1450).valueOf()));
  });

  it('should not allow to place a bet after deadline', () => {
      const bettor = accounts[1];
      const amount = 20;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 0, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettor, value:amount}))
      .then(() => bets.checkBalance({from: OWNER}))
      .then(asserts.equal(amount))
      .then(() => bets.spendTime())
      .then(() => asserts.throws(bets.placeBet(0, 0,  {from: bettor, value:amount})));
  });

});
