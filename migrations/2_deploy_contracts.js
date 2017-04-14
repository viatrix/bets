const Debts = artifacts.require('./Debts.sol');

module.exports = deployer => {
  deployer.deploy(Debts);
};
