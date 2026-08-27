// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Crowdfunding is ReentrancyGuard {
    struct Campaign {
        address creator;
        uint256 goal; 
        uint256 deadline;
        uint256 raised; // totale raccolto
        bool claimned; // bool per controllare se il creatore ha già ritirato i fondi
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions; // mapping per tenere traccia dei contributi degli utenti per ogni campagna
    uint256 public campaignCount;

    event CampaignCreated(
        uint256 indexed id,
        address indexed creator,
        uint256 goal,
        uint256 deadline
    );

    // Qualcuno ha versato campagna n contibutore x importo a
    event ContributionMade(
        uint256 indexed id,
        address indexed contributor,
        uint256 amount
    );

    // Il creatore ha ritirato campagna n cratore x importo a
    event FundsWithdrawn(
        uint256 indexed id,
        address indexed creator,
        uint256 amount
    ); 

    // È stato emesso un rimborsamento per la campagna n per il contributore x di importo a
    event RefundIssued(
        uint256 indexed id,
        address indexed contributor,
        uint256 amount
    );

    function createCampaign(uint256 _goal, uint256 _durationSeconds) external returns (uint256) {
        require(_goal > 0, "controllo goal > 0");
        require(_durationSeconds > 0, "controllo durata > 0");

        uint256 id = campaignCount;
        campaigns[id] = Campaign({
            creator: msg.sender,
            goal: _goal,
            deadline: block.timestamp + _durationSeconds,
            raised: 0,
            claimned: false
        });
        campaignCount++;
        emit CampaignCreated(id, msg.sender, _goal, block.timestamp + _durationSeconds);

        return id;
    }

    function contribute(uint256 _id) external payable {
        Campaign storage c = campaigns[_id];
        require(c.creator != address(0), "Campagna non esistente");
        require(block.timestamp < c.deadline, "Campagna scaduta");
        require(msg.value > 0, "Contributo deve essere maggiore di zero");

        c.raised += msg.value;
        contributions[_id][msg.sender] += msg.value;
        emit ContributionMade(_id, msg.sender, msg.value);
    }

    function withdraw(uint256 _id) external nonReentrant{
        Campaign storage c = campaigns[_id];

        require(msg.sender == c.creator, "Solo il creatore puo ritirare i fondi");
        require(block.timestamp >= c.deadline, "Campagna ancora attiva");
        require(c.raised >= c.goal, "Obiettivo non raggiunto");
        require(!c.claimned, "Fondi gia ritirati");

        // aggiorniamo lo stato prima per evitare un doppio spend 
        // il contratto potrebbe chiamare un altro contratto che chiama di nuovo questa funzione prima che la prima chiamata sia completata
        c.claimned = true;
        uint256 amount = c.raised;

        (bool ok, ) = payable(c.creator).call{value: amount}("");
        require(ok, "Trasferimento fallito");

        emit FundsWithdrawn(_id, c.creator, amount);
    }

    function refund(uint256 _id) external nonReentrant {
        Campaign storage c = campaigns[_id];
        require(block.timestamp >= c.deadline, "Campagna ancora attiva");
        require(c.raised < c.goal, "Obiettivo raggiunto, nessun rimborso disponibile");
        
        uint256 contributed = contributions[_id][msg.sender];
        require(contributed > 0, "Nessun contributo da rimborsare");

        contributions[_id][msg.sender] = 0; //reset contributo prima di inviare i fondi
        (bool ok, ) = payable(msg.sender).call{value: contributed}("");
        require(ok, "Trasferimento fallito");
        emit RefundIssued(_id, msg.sender, contributed);
    }
}