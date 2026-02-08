// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AIBOMRegistry
 * @notice 규제기관 문서와 AIBOM 문서를 분리 저장하는 온체인 레지스트리 (OpenZeppelin 4.x 대응 버전)
 */
contract AIBOMRegistry is Ownable {
    // -------------------------
    // ENUMS
    // -------------------------
    enum ReviewStatus {
        DRAFT,
        SUBMITTED,
        IN_REVIEW,
        APPROVED,
        REJECTED
    }

    // -------------------------
    // STRUCTS
    // -------------------------
    struct AIBOM {
        address owner;
        string cid; // AIBOM 문서 CID (감독기관용)
        uint256 timestamp;
        ReviewStatus status;
        string reviewReason;
    }

    struct RegulatoryDossier {
        string cid; // 규제기관 제출 문서 CID
        uint256 timestamp;
        string description; // 예: "MFDS 제출용 PDF"
    }

    struct Vulnerability {
        string cid;
        uint256 timestamp;
        string severity;
        bool active;
    }

    struct Advisory {
        string cid;
        string scope;
        string action;
        uint256 timestamp;
        address reporter;
    }

    // -------------------------
    // STATE
    // -------------------------
    uint256 public nextModelId;
    mapping(uint256 => AIBOM) public aiboms; // AIBOM 명세서 (감독기관)
    mapping(uint256 => RegulatoryDossier) public regulatoryDossiers; // 규제기관 제출 문서
    mapping(uint256 => string[]) private submissions; // AIBOM 관련 제출 로그
    mapping(uint256 => Vulnerability[]) public vulnerabilities;
    mapping(uint256 => Advisory[]) private advisories;
    mapping(address => bool) public supervisors; // 감독기관 계정

    // -------------------------
    // EVENTS
    // -------------------------
    event AIBOMRegistered(uint256 indexed modelId, address indexed dev, string cid);
    event RegulatoryDossierSubmitted(uint256 indexed modelId, string cid);
    event ReviewStatusChanged(uint256 indexed modelId, ReviewStatus status, string reason);
    event VulnerabilityReported(uint256 indexed modelId, string cid, string severity);
    event AdvisoryRecorded(uint256 indexed modelId, string cid, address reporter);

    // -------------------------
    // CONSTRUCTOR (OZ 4.x 전용)
    // -------------------------
    constructor() Ownable(msg.sender) {}

    // -------------------------
    // ACCESS CONTROL
    // -------------------------
    modifier onlySupervisorOrOwner() {
        require(supervisors[msg.sender] || owner() == msg.sender, "Not authorized");
        _;
    }

    // -------------------------
    // Supervisor management
    // -------------------------
    function addSupervisor(address who) external onlyOwner {
        supervisors[who] = true;
    }

    function removeSupervisor(address who) external onlyOwner {
        supervisors[who] = false;
    }

    // -------------------------
    // Developer API
    // -------------------------

    /// @notice AIBOM 등록 (감독기관용)
    function registerAIBOM(string calldata cid) external returns (uint256) {
        uint256 modelId = nextModelId++;
        aiboms[modelId] = AIBOM({
            owner: msg.sender,
            cid: cid,
            timestamp: block.timestamp,
            status: ReviewStatus.DRAFT,
            reviewReason: ""
        });
        emit AIBOMRegistered(modelId, msg.sender, cid);
        return modelId;
    }

    /// @notice 규제기관에 제출할 문서 등록
    function submitRegulatoryDossier(
        uint256 modelId,
        string calldata cid,
        string calldata desc
    ) external {
        require(modelId < nextModelId, "Invalid modelId");
        require(aiboms[modelId].owner == msg.sender, "Not owner");

        regulatoryDossiers[modelId] = RegulatoryDossier({
            cid: cid,
            timestamp: block.timestamp,
            description: desc
        });

        aiboms[modelId].status = ReviewStatus.SUBMITTED;
        submissions[modelId].push(cid);

        emit RegulatoryDossierSubmitted(modelId, cid);
        emit ReviewStatusChanged(modelId, ReviewStatus.SUBMITTED, desc);
    }

    // -------------------------
    // Regulator (owner) API
    // -------------------------
    function setReviewStatus(
        uint256 modelId,
        ReviewStatus status,
        string calldata reason
    ) external onlyOwner {
        require(modelId < nextModelId, "Invalid modelId");
        require(
            status == ReviewStatus.IN_REVIEW ||
                status == ReviewStatus.APPROVED ||
                status == ReviewStatus.REJECTED,
            "Invalid status"
        );

        aiboms[modelId].status = status;
        aiboms[modelId].reviewReason = reason;

        emit ReviewStatusChanged(modelId, status, reason);
    }

    // -------------------------
    // Supervisor functionality
    // -------------------------
    function getApprovedSubmissions(uint256 modelId)
        external
        view
        returns (string[] memory)
    {
        require(modelId < nextModelId, "Invalid modelId");
        require(aiboms[modelId].status == ReviewStatus.APPROVED, "Model not approved");
        require(supervisors[msg.sender] || owner() == msg.sender, "Not authorized");
        return submissions[modelId];
    }

    function recordAdvisory(
        uint256 modelId,
        string calldata cid,
        string calldata scope,
        string calldata action
    ) external onlySupervisorOrOwner {
        require(modelId < nextModelId, "Invalid modelId");

        Advisory memory a = Advisory({
            cid: cid,
            scope: scope,
            action: action,
            timestamp: block.timestamp,
            reporter: msg.sender
        });
        advisories[modelId].push(a);
        emit AdvisoryRecorded(modelId, cid, msg.sender);
    }

    // -------------------------
    // Watchdog / Vulnerability
    // -------------------------
    function reportVulnerability(
        uint256 modelId,
        string calldata cid,
        string calldata severity
    ) external onlyOwner {
        require(modelId < nextModelId, "Invalid modelId");
        vulnerabilities[modelId].push(
            Vulnerability({
                cid: cid,
                timestamp: block.timestamp,
                severity: severity,
                active: true
            })
        );
        emit VulnerabilityReported(modelId, cid, severity);
    }

    // -------------------------
    // 조회 함수 (Frontend용)
    // -------------------------
    function getAllAIBOMs() external view returns (AIBOM[] memory) {
        AIBOM[] memory list = new AIBOM[](nextModelId);
        for (uint256 i = 0; i < nextModelId; i++) {
            list[i] = aiboms[i];
        }
        return list;
    }

    function getRegulatoryDossier(uint256 modelId)
        external
        view
        onlyOwner
        returns (RegulatoryDossier memory)
    {
        return regulatoryDossiers[modelId];
    }

    function getVulnerabilities(uint256 modelId)
        external
        view
        returns (Vulnerability[] memory)
    {
        return vulnerabilities[modelId];
    }

    function getAdvisories(uint256 modelId)
        external
        view
        returns (Advisory[] memory)
    {
        return advisories[modelId];
    }

    function getMySubmissions(uint256 modelId)
        external
        view
        returns (string[] memory)
    {
        require(modelId < nextModelId, "Invalid modelId");
        require(aiboms[modelId].owner == msg.sender, "Not owner");
        return submissions[modelId];
    }
}
