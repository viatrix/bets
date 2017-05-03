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
      .then(() => bets.createGame("New bet", "case A", "case B", {from: OWNER}))
      .then(() => bets.numGames())
      .then(asserts.equal(1));
  });

  it('should allow to see the descriptions of the betting', () => {
      const descr = "New bet";
      const caseA = "case A";
      const caseB = "case B";
      return Promise.resolve()
      .then(() => bets.createGame(descr, caseA, caseB, {from: OWNER}))
      .then(() => bets.getDescription(0))
      .then(asserts.equal(descr))
      .then(() => bets.getDescrA(0))
      .then(asserts.equal(caseA))
      .then(() => bets.getDescrB(0))
      .then(asserts.equal(caseB));
  });

  it('should allow to search for the betting by description', () => {
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A1", "case B1", {from: OWNER}))
      .then(() => bets.createGame("New bet 2", "case A2", "case B2", {from: OWNER}))
      .then(() => bets.searchGame("New bet 1"))
      .then(asserts.equal(0))
      .then(() => bets.searchGame("New bet 2"))
      .then(asserts.equal(1));
  });

  it('should allow to place a bet on case A', () => {
      const bettor = accounts[1];
      const amount = 20;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", {from: OWNER}))
      .then(() => bets.placeBetA(0,  {from: bettor, value:amount}))
      .then(() => bets.checkBalance({from: OWNER}))
      .then(asserts.equal(amount));
  });

  it('should allow to place a bet on case B', () => {
      const bettor = accounts[1];
      const amount = 20;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", {from: OWNER}))
      .then(() => bets.placeBetB(0,  {from: bettor, value:amount}))
      .then(() => bets.checkBalance({from: OWNER}))
      .then(asserts.equal(amount));
  });

  it('should allow to resolve the game (case A wins)', () => {
      const bettorA = accounts[1];
      const bettorB = accounts[2];
      const amount = 2000;
      var adminBefore = web3.eth.getBalance(OWNER).valueOf();
      const gasPrice = web3.eth.gasPrice;
      var bettorA_before, adminAfter, bettorA_after;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", {from: OWNER}))
      .then(() => bettorA_before = web3.eth.getBalance(bettorA))
      .then(() => bets.placeBetA(0,  {from: bettorA, value:amount, gasPrice: gasPrice}))
      .then((result) => assert.equal(web3.eth.getBalance(bettorA).valueOf(),
      bettorA_before.sub(gasPrice.mul(result.receipt.gasUsed)).sub(amount).valueOf()));
//      .then(() => bets.placeBetB(0,  {from: bettorB, value:amount}))
//      .then(() => {bettorA_before = web3.eth.getBalance(bettorA).valueOf();
//                    adminBefore = web3.eth.getBalance(OWNER).valueOf();})
//      .then(() => bets.resolveGameA(0, {from: OWNER}))
//      .then((result) => {adminAfter = adminBefore-(result.receipt.gasUsed*gasPrice)+600;
//          assert.equal(web3.eth.getBalance(OWNER).valueOf(), adminAfter)})
    //  .then(() => asserts.throws(bets.placeBetA(0,  {from: bettorA, value:amount})))
    //  .then(() => asserts.equal(web3.toBigNumber(web3.eth.getBalance(OWNER)).lte(adminBefore)))
    //  .then(() => assert.isTrue(web3.toBigNumber(web3.eth.getBalance(bettorA)).lte(bettorA_before)));
  });

});
