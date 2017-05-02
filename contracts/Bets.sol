pragma solidity ^0.4.0;

contract Bets {
    address public admin;

    struct Bet {
        address bettor;
        uint amount;
    }

    struct Game {
        string description;
        string descrA;
        string descrB;
        bool isActive;
        uint numBetsA;
        uint numBetsB;
        mapping (uint => Bet) betsA;
        mapping (uint => Bet) betsB;
        string winner;
    }

    uint public numGames;
    mapping (uint => Game) public games;

    modifier onlyAdmin() {
        if (msg.sender != admin) {
            return;
        }
        _;
    }

    modifier onlyNotAdmin() {
        if (msg.sender == admin) {
            return;
        }
        _;
    }

    function Bets() {
        admin = msg.sender;
    }

    function createGame(string description, string descrA, string descrB)
            onlyAdmin() returns (string descr) {
        games[numGames] = Game({description: description,
            descrA: descrA,
            descrB: descrB,
            isActive: true,
            numBetsA: 0,
            numBetsB: 0,
            winner: ""});
        numGames++;
        return games[numGames-1].description;
    }

    function getDescription(uint num) constant returns (string descr) {
        return games[num].description;
    }

    function getDescrA(uint num) constant returns (string descrA) {
        return games[num].descrA;
    }

    function getDescrB(uint num) constant returns (string descrB) {
        return games[num].descrB;
    }

    function searchGame(string descr) constant returns (uint index) {
        for (var i=0; i<numGames; i++){
            if (sha3(games[i].description) == sha3(descr)) {
                return i;
            }
        }
    }

    function placeBetA(uint GameID) onlyNotAdmin() payable returns (uint betID){
        if (! games[GameID].isActive) throw;
        games[GameID].betsA[games[GameID].numBetsA].bettor = msg.sender;
        games[GameID].betsA[games[GameID].numBetsA].amount = msg.value;
        games[GameID].numBetsA++;
        return games[GameID].numBetsA - 1;
    }

    function placeBetB(uint GameID) onlyNotAdmin() payable returns (uint betID){
        if (! games[GameID].isActive) throw;
        games[GameID].betsB[games[GameID].numBetsB].bettor = msg.sender;
        games[GameID].betsB[games[GameID].numBetsB].amount = msg.value;
        games[GameID].numBetsB++;
        return games[GameID].numBetsB - 1;
    }

    function checkBalance() constant returns (uint balance){
        return this.balance;
    }

    function resolveGameA(uint GameID) onlyAdmin() returns (bool result) {
        games[GameID].isActive = false;
        games[GameID].winner = games[GameID].descrA;
        uint sumLosers = 0;
        uint sumWinners = 0;
        uint countWinners = 0;
        uint adminFee = 0;
        uint prize = 0;
        for (uint i=0; i<games[GameID].numBetsB; i++){
            sumLosers += games[GameID].betsB[i].amount;
        }
        for (i=0; i<games[GameID].numBetsA; i++){
            countWinners++;
            sumWinners += games[GameID].betsA[i].amount;
        }
        if (sumLosers == 0) return;
        if (sumWinners==0) {
            if(!admin.send(sumLosers)){  return false;    }
        }
        else {
            adminFee = sumLosers/10;
            prize = (sumLosers-adminFee)/sumWinners;
            if(!admin.send(adminFee)){  return false;    }
            for (i=0; i<games[GameID].numBetsA; i++){
                if(!games[GameID].betsA[i].bettor.send(
                    prize*(games[GameID].betsA[i].amount))) {return false;}
            }
        }
        return true;
    }

    function _assert(bool _assertion) internal {
        if (!_assertion) {
            throw;
        }
    }

    function _safeSub(uint _a, uint _b) internal constant returns(uint) {
        _assert(_b <= _a);
        return _a - _b;
    }

    function _safeAdd(uint _a, uint _b) internal constant returns(uint) {
        uint c = _a + _b;
        _assert(c >= _a);
        return c;
    }
}
