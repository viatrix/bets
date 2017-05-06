pragma solidity ^0.4.0;

contract Bets {
    address public admin;

    struct Bet {
        address bettor;
        uint betCase;
        uint amount;
    }

    struct Game {
        string description;
        string descr1;
        string descr2;
        bool isActive;
        uint numBets;
        mapping (uint => Bet) bets;
        uint winner;
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

    function createGame(string description, string descr1, string descr2)
            onlyAdmin() returns (string descr) {
        games[numGames] = Game({description: description,
            descr1: descr1,
            descr2: descr2,
            isActive: true,
            numBets: 0,
            winner: 0});
        numGames++;
        return games[numGames-1].description;
    }

    function getDescription(uint num) constant returns (string descr) {
        return games[num].description;
    }

    function getDescr1(uint num) constant returns (string descr1) {
        return games[num].descr1;
    }

    function getDescr2(uint num) constant returns (string descr2) {
        return games[num].descr2;
    }

    function searchGame(string descr) constant returns (uint index) {
        for (var i=0; i<numGames; i++){
            if (sha3(games[i].description) == sha3(descr)) {
                return i;
            }
        }
    }

    function placeBet(uint GameID, uint Case) onlyNotAdmin() payable returns (bool result){
        if (! games[GameID].isActive) throw;
        if ((Case != 1) && (Case != 2)) throw;
        games[GameID].bets[games[GameID].numBets].betCase = Case;
        games[GameID].bets[games[GameID].numBets].bettor = msg.sender;
        games[GameID].bets[games[GameID].numBets].amount = msg.value;
        games[GameID].numBets++;
        return true;
    }

    function checkBalance() constant returns (uint balance){
        return this.balance;
    }

    function resolveGame(uint GameID, uint winnerCase) onlyAdmin() returns (bool result) {
        uint sumLosers = 0;
        uint sumWinners = 0;
        uint adminFee = 0;
        uint rate = 0;
        uint i;
        uint gameBalance = 0;
        uint prize = 0;
        if ((winnerCase != 1) && (winnerCase != 2)) throw;
        games[GameID].winner = winnerCase;
        games[GameID].isActive = false;
        for (i=0; i<games[GameID].numBets; i++)
            if (games[GameID].bets[i].betCase == winnerCase)
                sumWinners += games[GameID].bets[i].amount;
            else sumLosers += games[GameID].bets[i].amount;
        gameBalance = sumLosers+sumWinners;
        if (sumWinners == 0) {
            if(!admin.send(sumLosers)){  throw;    }
        }
        else {
            adminFee = sumLosers/10;
            rate = (sumLosers-adminFee)*1000/sumWinners;
            if(!admin.send(adminFee)){  throw;    }
            gameBalance = _safeSub(gameBalance, adminFee);
            for (i=0; i<games[GameID].numBets; i++){
                if (games[GameID].bets[i].betCase == winnerCase) {
                    prize = rate*(games[GameID].bets[i].amount)/1000+games[GameID].bets[i].amount;
                    if(!games[GameID].bets[i].bettor.send(prize))
                            {throw;}
                        gameBalance = _safeSub(gameBalance, prize);
                    }
                }
            }
            if (gameBalance > 0)
                if(!admin.send(gameBalance)){  throw;    }
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
