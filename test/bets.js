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
      const bettorA1 = accounts[1];
      const bettorA2 = accounts[2];
      const amount = 20;
      return Promise.resolve()
      then(() => bets.createGame("New bet 1", "case A1", "case B1", {from: OWNER}))
      .then(() => bets.placeBetA(0,  {from: bettorA1, value:20}))
      .then(() => bets.placeBetA(0, {from: bettorA2, value:40}))
      .then(asserts.equal(1000));
  });

});
