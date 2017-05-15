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

  it('should allow to emit an event when a bet is placed', () => {
      const bettor = accounts[1];
      const amount = 20;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettor, value:amount}))
      .then(result => {
            assert.equal(result.logs.length, 1);
            assert.equal(result.logs[0].event, 'BetPlaced');
            assert.equal(result.logs[0].args.bettor, bettor);
            assert.equal(result.logs[0].args.GameID, 0);
            assert.equal(result.logs[0].args.betCase, 0);
            assert.equal(result.logs[0].args.amount.valueOf(), amount);
          });
  });

  it('should emit an event when the game is resolved', () => {
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.createGame("New bet 2", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.resolveGame(1, 0, {from: OWNER}))
      .then(result => {
            assert.equal(result.logs.length, 1);
            assert.equal(result.logs[0].event, 'GameResolved');
            assert.equal(result.logs[0].args.GameID, 1);
            assert.equal(result.logs[0].args.winner, 0);
          });
  });

    it('should emit an event when the prize is claimed', () => {
        const bettorA1 = accounts[1];
        const bettorA2 = accounts[1];
        const bettorB = accounts[2];
        const amount = 2000;
        return Promise.resolve()
        .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
        .then(() => bets.placeBet(0, 0,  {from: bettorA1, value:amount}))
        .then(() => bets.placeBet(0, 0,  {from: bettorA2, value:amount}))
        .then(() => bets.placeBet(0, 1,  {from: bettorB, value:amount}))
        .then(() => bets.resolveGame(0, 0, {from: OWNER}))
        .then(() => bets.claimPrize(0,0))
        .then(result => {
              assert.equal(result.logs.length, 1);
              assert.equal(result.logs[0].event, 'WinnerGotPrize');
              assert.equal(result.logs[0].args.GameID, 0);
              assert.equal(result.logs[0].args.bettor, bettorA1);
              assert.equal(result.logs[0].args.amount, 2900);
          });
    });

  it('should emit an event when all prizes are claimed', () => {
      const bettorA1 = accounts[1];
      const bettorA2 = accounts[2];
      const bettorB1 = accounts[3];
      const bettorB2 = accounts[4];
      const amount1 = 1500;
      const amount2 = 500;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA1, value:amount1}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA2, value:amount2}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB1, value:amount1*2}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB2, value:amount2*2}))
      .then(() => bets.resolveGame(0, 1, {from: OWNER, gasPrice: gasPrice}))
      .then(() => bets.claimPrize(0,2, {from: OWNER, gasPrice: gasPrice}))
      .then(result => {
            assert.equal(result.logs.length, 1);
            assert.equal(result.logs[0].event, 'WinnerGotPrize');
            assert.equal(result.logs[0].args.GameID, 0);
            assert.equal(result.logs[0].args.bettor, bettorB1);
        })
      .then(() => bets.claimPrize(0,3, {from: OWNER, gasPrice: gasPrice}))
      .then(result => {
            assert.equal(result.logs.length, 2);
            assert.equal(result.logs[0].event, 'WinnerGotPrize');
            assert.equal(result.logs[0].args.GameID, 0);
            assert.equal(result.logs[0].args.bettor, bettorB2);
            assert.equal(result.logs[1].event, 'AllWinnersGotPrize');
            assert.equal(result.logs[1].args.GameID, 0);
        });
  });


  it('should not allow to get prize for an active game', () => {
      const bettorA = accounts[1];
      const amount = 2000;
      var adminBefore, bettorA_before;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA, value:amount}))
      .then(() =>  bettorA_before = web3.eth.getBalance(bettorA))
      .then(() => asserts.throws(bets.claimPrize(0,0, {gasPrice: gasPrice})))
      .then(() => assert.equal(web3.eth.getBalance(bettorA).valueOf(),
            bettorA_before.valueOf()));
  });

  it('should not allow to place a bet on a non-existing game', () => {
      const bettorA = accounts[1];
      const amount = 2000;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => asserts.throws(bets.placeBet(1, 0,  {from: bettorA, value:amount})));
  });

  it('should not allow to place a bet on a non-existing case', () => {
      const bettorA = accounts[1];
      const amount = 2000;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => asserts.throws(bets.placeBet(0, 2,  {from: bettorA, value:amount})));
  });

  it('should not allow to place a bet without sending money', () => {
      const bettorA = accounts[1];
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => asserts.throws(bets.placeBet(0, 0,  {from: bettorA})));
  });

  it('should not allow to claim a prize for a non-existing bet id', () => {
      const bettorA1 = accounts[1];
      const bettorA2 = accounts[2];
      const bettorB1 = accounts[3];
      const bettorB2 = accounts[4];
      const amount1 = 1500;
      const amount2 = 500;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA1, value:amount1}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA2, value:amount2}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB1, value:amount1*2}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB2, value:amount2*2}))
      .then(() => bets.resolveGame(0, 1, {from: OWNER, gasPrice: gasPrice}))
      .then(() => asserts.throws(bets.claimPrize(0,4)));
  });

  it('should not allow to resolve a game and assign a non-existing winner case', () => {
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => asserts.throws(bets.resolveGame(0, 2, {from: OWNER})));
  });

  it('should not allow to get prize more than once', () => {
      const bettorA1 = accounts[1];
      const bettorA2 = accounts[2];
      const bettorB1 = accounts[3];
      const bettorB2 = accounts[4];
      const amount1 = 1500;
      const amount2 = 500;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA1, value:amount1}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA2, value:amount2}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB1, value:amount1*2}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB2, value:amount2*2}))
      .then(() => bets.resolveGame(0, 1, {from: OWNER, gasPrice: gasPrice}))
      .then(() => bets.claimPrize(0,2, {from: OWNER, gasPrice: gasPrice}))
      .then(() => asserts.throws(bets.claimPrize(0,2, {from: OWNER, gasPrice: gasPrice})));
  });

  it('should not allow to get prize for a loser', () => {
      const bettorA1 = accounts[1];
      const bettorA2 = accounts[2];
      const bettorB1 = accounts[3];
      const bettorB2 = accounts[4];
      const amount1 = 1500;
      const amount2 = 500;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA1, value:amount1}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA2, value:amount2}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB1, value:amount1*2}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB2, value:amount2*2}))
      .then(() => bets.resolveGame(0, 1, {from: OWNER, gasPrice: gasPrice}))
      .then(() => asserts.throws(bets.claimPrize(0,0, {from: OWNER, gasPrice: gasPrice})));
  });

  it('should allow to get remainings', () => {
      const bettorA1 = accounts[1];
      const bettorA2 = accounts[2];
      const bettorB1 = accounts[3];
      const bettorB2 = accounts[4];
      const amount1 = 1333;
      const amount2 = 333;
      var adminBefore = 0;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA1, value:amount1}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA2, value:amount2}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB1, value:amount1*3}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB2, value:amount2*3}))
      .then(() => bets.resolveGame(0, 1, {from: OWNER, gasPrice: gasPrice}))
      .then(() => bets.claimPrize(0,2, {from: OWNER, gasPrice: gasPrice}))
      .then(() => bets.claimPrize(0,3, {from: OWNER, gasPrice: gasPrice}))
      .then(() =>  adminBefore = web3.eth.getBalance(OWNER))
      .then(() => bets.claimRemainings(0, {from: OWNER, gasPrice: gasPrice}))
      .then((result) => assert.equal(web3.eth.getBalance(OWNER).valueOf(),
            adminBefore.sub(gasPrice.mul(result.receipt.gasUsed)).add(1).valueOf()));
  });

  it('should not allow to get remainings for an active game', () => {
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => asserts.throws(bets.claimRemainings(0, 2, {from: OWNER})));
  });

  it('should not allow to get remainings when there are active winners', () => {
      const bettorA1 = accounts[1];
      const bettorA2 = accounts[2];
      const bettorB1 = accounts[3];
      const bettorB2 = accounts[4];
      const amount1 = 1333;
      const amount2 = 333;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA1, value:amount1}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA2, value:amount2}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB1, value:amount1*3}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB2, value:amount2*3}))
      .then(() => bets.resolveGame(0, 1, {from: OWNER, gasPrice: gasPrice}))
      .then(() => asserts.throws(bets.claimRemainings(0, 2, {from: OWNER})));
  });

  it('should allow to get prize for admin when there are no winner bets', () => {
      const bettorA = accounts[1];
      const amount = 2000;
      var adminBefore;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA, value:amount}))
      .then(() =>  adminBefore = web3.eth.getBalance(OWNER))
      .then(() => bets.resolveGame(0, 1, {from: OWNER, gasPrice: gasPrice}))
      .then((result) => assert.equal(web3.eth.getBalance(OWNER).valueOf(),
            adminBefore.sub(gasPrice.mul(result.receipt.gasUsed)).add(2000).valueOf()));
  });

  it('should allow to get bet back when there are no loser bets', () => {
      const bettorA = accounts[1];
      const amount = 2000;
      var bettorA_Before;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 1,  {from: bettorA, value:amount}))
      .then(() => bets.resolveGame(0, 1, {from: OWNER, gasPrice: gasPrice}))
      .then(() =>  bettorA_Before = web3.eth.getBalance(bettorA))
      .then(() => bets.claimPrize(0,0))
      .then((result) => assert.equal(web3.eth.getBalance(bettorA).valueOf(),
            bettorA_Before.add(amount).valueOf()));
  });

  it('should not allow to get bet back more than once', () => {
      const bettorA = accounts[1];
      const amount = 2000;
      var bettorA_Before;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 1,  {from: bettorA, value:amount}))
      .then(() => bets.resolveGame(0, 1, {from: OWNER, gasPrice: gasPrice}))
      .then(() =>  bettorA_Before = web3.eth.getBalance(bettorA))
      .then(() => bets.claimPrize(0,0))
      .then((result) => assert.equal(web3.eth.getBalance(bettorA).valueOf(),
            bettorA_Before.add(amount).valueOf()))
      .then(() => asserts.throws(bets.claimPrize(0,0)));
  });

  it('should not allow to set winner more than once', () => {
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.resolveGame(0, 1, {from: OWNER}))
      .then(() => asserts.throws(bets.resolveGame(0, 1, {from: OWNER})));
  });

  it('should allow to end the game in a draw', () => {
      const bettorA = accounts[1];
      const bettorB = accounts[2];
      const amount = 2000;
      var bettorA_Before, bettorB_before;
      const gasPrice = web3.eth.gasPrice;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettorA, value:amount}))
      .then(() => bets.placeBet(0, 1,  {from: bettorB, value:amount}))
      .then(() => bets.endGameInADraw(0, {from: OWNER, gasPrice: gasPrice}))
      .then(() =>  bettorA_Before = web3.eth.getBalance(bettorA))
      .then(() => bets.claimPrize(0,0))
      .then((result) => assert.equal(web3.eth.getBalance(bettorA).valueOf(),
            bettorA_Before.add(amount).valueOf()))
      .then(() =>  bettorB_Before = web3.eth.getBalance(bettorB))
      .then(() => bets.claimPrize(0,1))
      .then((result) => assert.equal(web3.eth.getBalance(bettorB).valueOf(),
          bettorB_Before.add(amount).valueOf()));
  });

  it('should emit an event if the game ended in a draw', () => {
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 100, {from: OWNER}))
      .then(() => bets.endGameInADraw(0, {from: OWNER}))
      .then(result => {
            assert.equal(result.logs.length, 1);
            assert.equal(result.logs[0].event, 'GameEndedInADraw');
            assert.equal(result.logs[0].args.GameID, 0);
        });
  });

  it('should not allow to place a bet after deadline - async', () => {
      const bettor = accounts[1];
      const amount = 20;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 2, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettor, value:amount}))
      .then(() => bets.checkBalance({from: OWNER}))
      .then(asserts.equal(amount))
      .then(() => {
            return new Promise((resolve, reject) => {
            setTimeout(() => {asserts.throws(bets.placeBet(0, 0,  {from: bettor, value:amount}));
            resolve("result")}, 3000)
            });
        });
  });

  it('should not allow to place a bet after deadline - async, increaseTime', () => {
      const bettor = accounts[1];
      const amount = 20;
      return Promise.resolve()
      .then(() => bets.createGame("New bet 1", "case A", "case B", 2, {from: OWNER}))
      .then(() => bets.placeBet(0, 0,  {from: bettor, value:amount}))
      .then(() => bets.checkBalance({from: OWNER}))
      .then(asserts.equal(amount))
      .then(() => {return new Promise((resolve, reject) => {
          web3.currentProvider.sendAsync({
                  jsonrpc: "2.0",
                  method: "evm_increaseTime",
                  params: [3],
                  id: new Date().getTime()
              }, (error, result) => error ? reject(error) : resolve(result.result))
            })
        })
      .then(() => asserts.throws(bets.placeBet(0, 0,  {from: bettor, value:amount})));
  });

});
