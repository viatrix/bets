pragma solidity ^0.4.0;

contract Bets {
    address public admin;

    struct Bet {
        address bettor;
        string betCase;
        uint amount;
        bool isActive;
    }

    struct Game {
        string description;
        string descrA;
        string descrB;
        bool isActive;
        uint numBetsA;
        uint numBetsB;
        uint numActiveWinnerBets;
        mapping (uint => Bet) bets;
        uint sumBetsA;
        uint sumBetsB;
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
            numActiveWinnerBets: 0,
            sumBetsA: 0,
            sumBetsB: 0,
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

    function placeBet(uint GameID, string Case) onlyNotAdmin() payable returns (bool result){
        uint numBets;
        if ((! games[GameID].isActive) || (msg.value == 0)) throw;
        numBets = games[GameID].numBetsA+games[GameID].numBetsB;
        if ((sha3(Case) == sha3("A")) || (sha3(Case) == sha3("a"))) {
            games[GameID].bets[numBets].betCase = "A";
            games[GameID].sumBetsA += msg.value;
            games[GameID].numBetsA++;
        }
        else if ((sha3(Case) == sha3("B")) || (sha3(Case) == sha3("b"))) {
            games[GameID].bets[numBets].betCase = "B";
            games[GameID].sumBetsB += msg.value;
            games[GameID].numBetsB++;
        }
        else throw;
        games[GameID].bets[numBets].bettor = msg.sender;
        games[GameID].bets[numBets].amount = msg.value;
        games[GameID].bets[numBets].isActive = true;
        return true;
    }

    function checkBalance() constant returns (uint balance){
        return this.balance;
    }

    function claimPrize(uint GameID, uint BetID) returns (uint prize) {
        uint sumLosers = 0;
        uint sumWinners = 0;
        prize = 0;
        if ((games[GameID].isActive == true) ||
            (sha3(games[GameID].winner) != sha3(games[GameID].bets[BetID].betCase)) ||
            (games[GameID].bets[BetID].isActive == false))
            {throw;}
        if (sha3(games[GameID].winner) == sha3("A")) {
            sumLosers = games[GameID].sumBetsB;
            sumWinners = games[GameID].sumBetsA;
        }
        else {
            sumLosers = games[GameID].sumBetsA;
            sumWinners = games[GameID].sumBetsB;
        }
        if (sumLosers == 0) {return 0;}
        prize =  (sumLosers*1000/sumWinners)*(games[GameID].bets[BetID].amount)/1000;
        if(!games[GameID].bets[BetID].bettor.send(prize+games[GameID].bets[BetID].amount))
                {throw;}
        sumLosers = _safeSub(sumLosers, prize);
        sumWinners = _safeSub(sumWinners, games[GameID].bets[BetID].amount);
        if (sha3(games[GameID].winner) == sha3("A")) {
            games[GameID].sumBetsB = sumLosers;
            games[GameID].sumBetsA = sumWinners;
        }
        else {
            games[GameID].sumBetsA = sumLosers;
            games[GameID].sumBetsB = sumWinners;
        }
        games[GameID].numActiveWinnerBets = games[GameID].numActiveWinnerBets-1;
        return prize;
    }

    function claimRemainings(uint GameID) onlyAdmin() returns (uint remainings) {
        uint sumLosers;
        if ((games[GameID].isActive == true) ||
            (games[GameID].numActiveWinnerBets != 0))
            {throw;}
        if (sha3(games[GameID].winner) == sha3("A"))
            sumLosers = games[GameID].sumBetsB;
        else
            sumLosers = games[GameID].sumBetsA;
        if (sumLosers > 0)
            if(!admin.send(sumLosers)){  throw;    }
        if (sha3(games[GameID].winner) == sha3("A"))
            games[GameID].sumBetsB = 0;
        else
            games[GameID].sumBetsA = 0;
        return sumLosers;
    }

    function resolveGame(uint GameID, string winnerCase) onlyAdmin() returns (bool result) {
        uint sumLosers = 0;
        uint sumWinners = 0;
        uint adminFee = 0;
        if ((sha3(winnerCase) == sha3("A")) || (sha3(winnerCase) == sha3("a"))) {
            games[GameID].winner = "A";
            sumLosers = games[GameID].sumBetsB;
            sumWinners = games[GameID].sumBetsA;
            games[GameID].numActiveWinnerBets = games[GameID].numBetsA;
            }
        else if ((sha3(winnerCase) == sha3("B")) || (sha3(winnerCase) == sha3("b"))) {
            games[GameID].winner = "B";
            sumLosers = games[GameID].sumBetsA;
            sumWinners = games[GameID].sumBetsB;
            games[GameID].numActiveWinnerBets = games[GameID].numBetsB;
            }
        else return false;
        games[GameID].isActive = false;
        if (sumWinners == 0) {
            if(!admin.send(sumLosers)){  throw;    }
        }
        else {
            adminFee = sumLosers/10;
            if(!admin.send(adminFee)){  throw;    }
            if (sha3(winnerCase) == sha3("A"))
                games[GameID].sumBetsB = _safeSub(sumLosers, adminFee);
            else
                games[GameID].sumBetsA = _safeSub(sumLosers, adminFee);
            return true;
        }
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
