pragma solidity ^0.4.0;

contract Bets {
    address public admin;

    struct Bet {
        address bettor;
        string betCase;
        uint amount;
    }

    struct Game {
        string description;
        string descrA;
        string descrB;
        bool isActive;
        uint numBets;
        mapping (uint => Bet) bets;
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
            numBets: 0,
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
        // What if there is millions of games? Maybe searches should take constant time whenever possible.
        for (var i=0; i<numGames; i++){
            if (sha3(games[i].description) == sha3(descr)) {
                return i;
            }
        }
    }

    function placeBet(uint GameID, string Case) onlyNotAdmin() payable returns (bool result){
        // What if user sent ETH to inactive game? It will just sit here unnoticed.
        if (! games[GameID].isActive) return false;
        if ((sha3(Case) == sha3("A")) || (sha3(Case) == sha3("a")))
            games[GameID].bets[games[GameID].numBets].betCase = "A";
        else if ((sha3(Case) == sha3("B")) || (sha3(Case) == sha3("b")))
            games[GameID].bets[games[GameID].numBets].betCase = "B";
        else throw;
        games[GameID].bets[games[GameID].numBets].bettor = msg.sender;
        games[GameID].bets[games[GameID].numBets].amount = msg.value;
        games[GameID].numBets++;
        return true;
    }

    function checkBalance() constant returns (uint balance){
        return this.balance;
    }

    function resolveGame(uint GameID, string winnerCase) onlyAdmin() returns (bool result) {
        uint sumLosers = 0;
        uint sumWinners = 0;
        uint adminFee = 0;
        uint rate = 0;
        uint i;
        if ((sha3(winnerCase) == sha3("A")) || (sha3(winnerCase) == sha3("a"))) {
            games[GameID].winner = "A";
            }
        else if ((sha3(winnerCase) == sha3("B")) || (sha3(winnerCase) == sha3("b"))) {
            games[GameID].winner = "B";
            }
        else return false;
        games[GameID].isActive = false;
        // What if there is a million of bets? This loop will never have enough gas.
        for (i=0; i<games[GameID].numBets; i++)
            if (sha3(games[GameID].bets[i].betCase) == sha3(games[GameID].winner))
                sumWinners += games[GameID].bets[i].amount;
            else sumLosers += games[GameID].bets[i].amount;
        if (sumWinners == 0) {
            // If send to admin failed, then this game's ETH will be locked forever, cause game inactive now.
            if(!admin.send(sumLosers)){  return false;    }
        }
        else {
            adminFee = sumLosers/10;
            rate = (sumLosers-adminFee)*1000/sumWinners;
            // If send to admin failed, then this game's ETH will be locked forever, cause game inactive now.
            if(!admin.send(adminFee)){  return false;    }
            // What if there is a million of bets? This loop will never have enough gas.
            for (i=0; i<games[GameID].numBets; i++){
                if (sha3(games[GameID].bets[i].betCase) == sha3(games[GameID].winner))
                    // If send to bettor failed, then this game's ETH will be locked forever, cause game inactive now.
                    if(!games[GameID].bets[i].bettor.send(
                        rate*(games[GameID].bets[i].amount)/1000+games[GameID].bets[i].amount))
                            {return false;}
                    }
            }
            return true;
        }

    function getUserBalance(address user) constant returns (uint balance) {
        return user.balance;
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
