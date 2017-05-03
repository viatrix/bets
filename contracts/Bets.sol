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

    function placeBet(uint GameID, string Case) onlyNotAdmin() payable returns (bool result){
        if (! games[GameID].isActive) return false;
        if ((sha3(Case) == sha3("A")) || (sha3(Case) == sha3("a"))) {
            games[GameID].betsA[games[GameID].numBetsA].bettor = msg.sender;
            games[GameID].betsA[games[GameID].numBetsA].amount = msg.value;
            games[GameID].numBetsA++;
            return true;
            }
        else if ((sha3(Case) == sha3("B")) || (sha3(Case) == sha3("b"))) {
            games[GameID].betsB[games[GameID].numBetsB].bettor = msg.sender;
            games[GameID].betsB[games[GameID].numBetsB].amount = msg.value;
            games[GameID].numBetsB++;
            return true;
            }
        else return false;
    }

    function checkBalance() constant returns (uint balance){
        return this.balance;
    }

    function resolveGame(uint GameID, string Case) onlyAdmin() returns (bool result) {
        uint sumLosers = 0;
        uint sumWinners = 0;
        uint adminFee = 0;
        uint prize = 0;
        uint i;
        if ((sha3(Case) == sha3("A")) || (sha3(Case) == sha3("a"))) {
            games[GameID].winner = games[GameID].descrA;
            games[GameID].isActive = false;
            for (i=0; i<games[GameID].numBetsB; i++){
                sumLosers += games[GameID].betsB[i].amount;
            }
            for (i=0; i<games[GameID].numBetsA; i++){
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
        else if ((sha3(Case) == sha3("B")) || (sha3(Case) == sha3("b"))) {
            games[GameID].winner = games[GameID].descrB;
            games[GameID].isActive = false;
            for (i=0; i<games[GameID].numBetsA; i++){
                sumLosers += games[GameID].betsA[i].amount;
            }
            for (i=0; i<games[GameID].numBetsB; i++){
                sumWinners += games[GameID].betsB[i].amount;
            }
            if (sumLosers == 0) return;
            if (sumWinners==0) {
                if(!admin.send(sumLosers)){  return false;    }
            }
            else {
                adminFee = sumLosers/10;
                prize = (sumLosers-adminFee)/sumWinners;
                if(!admin.send(adminFee)){  return false;    }
                for (i=0; i<games[GameID].numBetsB; i++){
                    if(!games[GameID].betsB[i].bettor.send(
                        prize*(games[GameID].betsB[i].amount))) {return false;}
                }
            }
            return true;
            }
        else return false;

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
