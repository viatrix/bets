pragma solidity 0.4.11;

contract Bets {
    address public admin;

    struct Bet {
        address bettor;
        uint betCase;
        uint amount;
        bool isActive;
    }

    struct Game {
        string description;
        string[2] descr;
        bool isActive;
        uint[2] numBets;
        uint numActiveWinnerBets;
        mapping (uint => Bet) bets;
        uint[2] sumBets;
        uint winner;
        uint deadline;
    }

    uint public numGames;
    mapping (uint => Game) public games;

    event BetPlaced(address indexed bettor, uint indexed GameID, uint indexed betCase, uint amount);
    event GameResolved(uint indexed GameID, uint winner);
    event WinnersGotPrize(uint indexed GameID);

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

//Main functions

    function createGame(string description, string descr0, string descr1, uint duration)
            onlyAdmin() returns (string descr) {
        games[numGames] = Game({description: description,
            descr: [descr0, descr1],
            isActive: true,
            numBets: [uint256(0), uint256(0)],
            numActiveWinnerBets: 0,
            sumBets: [uint256(0), uint256(0)],
            winner: 0,
            deadline: now + duration * 1 seconds
        });
        numGames++;
        return games[numGames-1].description;
    }

    function placeBet(uint GameID, uint Case) onlyNotAdmin() payable returns (bool result){
        uint numBets;
        if ((! games[GameID].isActive) || (msg.value == 0) || (now > games[GameID].deadline)) throw;
        if ((Case != 0) && (Case != 1)) throw;
        numBets = games[GameID].numBets[0]+games[GameID].numBets[1];
        games[GameID].bets[numBets].betCase = Case;
        games[GameID].sumBets[Case] += msg.value;
        games[GameID].numBets[Case]++;
        games[GameID].bets[numBets].bettor = msg.sender;
        games[GameID].bets[numBets].amount = msg.value;
        games[GameID].bets[numBets].isActive = true;
        BetPlaced(msg.sender, GameID, Case, msg.value);
        return true;
    }

    function claimPrize(uint GameID, uint BetID) returns (uint prize) {
        uint sumLosers = 0;
        uint sumWinners = 0;
        prize = 0;
        if ((games[GameID].isActive == true) ||
            (games[GameID].winner != games[GameID].bets[BetID].betCase) ||
            (games[GameID].bets[BetID].isActive == false))
            {throw;}

        sumLosers = games[GameID].sumBets[loser(games[GameID].winner)];
        sumWinners = games[GameID].sumBets[games[GameID].winner];

        if (sumLosers == 0) {
            if(!games[GameID].bets[BetID].bettor.send(games[GameID].bets[BetID].amount))
                    {throw;}
            games[GameID].bets[BetID].isActive = false;
            return 0;
            }
        prize =  (sumLosers*1000/sumWinners)*(games[GameID].bets[BetID].amount)/1000;
        if(!games[GameID].bets[BetID].bettor.send(prize+games[GameID].bets[BetID].amount))
                {throw;}
        games[GameID].bets[BetID].isActive = false;
        sumLosers = _safeSub(sumLosers, prize);
        sumWinners = _safeSub(sumWinners, games[GameID].bets[BetID].amount);
        games[GameID].sumBets[games[GameID].winner] = sumWinners;
        games[GameID].sumBets[loser(games[GameID].winner)] = sumLosers;
        games[GameID].numActiveWinnerBets = games[GameID].numActiveWinnerBets-1;
        if (games[GameID].numActiveWinnerBets == 0) WinnersGotPrize(GameID);
        return prize;
    }

    function claimRemainings(uint GameID) onlyAdmin() returns (uint remainings) {
        uint sumLosers;
        if ((games[GameID].isActive == true) ||
            (games[GameID].numActiveWinnerBets != 0))
            {throw;}
        sumLosers = games[GameID].sumBets[loser(games[GameID].winner)];
        if (sumLosers > 0)
            if(!admin.send(sumLosers)){  throw;    }
        games[GameID].sumBets[loser(games[GameID].winner)] = 0;
        return sumLosers;
    }

    function resolveGame(uint GameID, uint winnerCase) onlyAdmin() returns (bool result) {
        uint sumLosers = 0;
        uint sumWinners = 0;
        uint adminFee = 0;
        if ((winnerCase != 0) && (winnerCase != 1)) throw;
        games[GameID].winner = winnerCase;
        sumLosers = games[GameID].sumBets[loser(winnerCase)];
        sumWinners = games[GameID].sumBets[winnerCase];
        games[GameID].numActiveWinnerBets = games[GameID].numBets[winnerCase];
        games[GameID].isActive = false;
        if (sumWinners == 0) {
            if(!admin.send(sumLosers)){  throw;    }
        }
        else if (sumLosers > 0){
            adminFee = sumLosers/10;
            if(!admin.send(adminFee)){  throw;    }
            games[GameID].sumBets[loser(winnerCase)] = _safeSub(sumLosers, adminFee);
        }
        GameResolved(GameID, winnerCase);
        return true;
    }

//Getters

    function getDescription(uint num) constant returns (string descr) {
        return games[num].description;
    }

    function getDescr0(uint num) constant returns (string descr0) {
        return games[num].descr[0];
    }

    function getDescr1(uint num) constant returns (string descr1) {
        return games[num].descr[1];
    }

    function checkBalance() constant returns (uint balance){
        return this.balance;
    }

    function getUserBalance(address user) constant returns (uint balance) {
        return user.balance;
    }

    function getRemainingTime(uint GameID) constant returns (uint remainingSeconds) {
        return games[GameID].deadline-now;
    }

//Helpers

    function loser(uint winner) constant returns (uint loserIndex) {
        if (winner == 0) return 1;
        else if (winner == 1) return 0;
        else throw;
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
