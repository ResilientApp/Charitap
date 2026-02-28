pragma solidity >=0.8.0 <0.9.0;

contract DonationReceipt {
    address public owner;
    uint256 public receiptCount;
    mapping(uint256 => uint256) public charityOf;
    mapping(uint256 => uint256) public amountOf;
    mapping(uint256 => uint256) public totalByCharity;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "DonationReceipt: caller is not the owner");
        _;
    }

    function mintReceipt(uint256 charityId, uint256 amountCents) public onlyOwner returns (uint256) {
        receiptCount = receiptCount + 1;
        charityOf[receiptCount] = charityId;
        amountOf[receiptCount] = amountCents;
        totalByCharity[charityId] = totalByCharity[charityId] + amountCents;
        return receiptCount;
    }

    function getReceipt(uint256 receiptId) public view returns (uint256 charityId, uint256 amountCents) {
        return (charityOf[receiptId], amountOf[receiptId]);
    }

    function getTotalByCharity(uint256 charityId) public view returns (uint256) {
        return totalByCharity[charityId];
    }
}
