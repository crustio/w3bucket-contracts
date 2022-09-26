// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableMapUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

import "./lib/CurrencyTransferLib.sol";

abstract contract BucketEditionUpgradable is Initializable, AccessControlEnumerableUpgradeable {
    using EnumerableMapUpgradeable for EnumerableMapUpgradeable.UintToUintMap;
    using EnumerableMapUpgradeable for EnumerableMapUpgradeable.AddressToUintMap;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 public constant EDITIONS_ADMIN_ROLE = keccak256("EDITIONS_ADMIN_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    uint256 public constant MIN_EDITION_ID = 1;
    uint256 public constant MAX_EDITION_ID = 100;
    uint256 public constant EDITION_TOKEN_ID_FACTOR = 1_000_000;
    uint256 public constant EDITION_MAX_MINTABLE_SUPPLY = 1_000_000;

    EnumerableSetUpgradeable.UintSet internal _allEditions;
    EnumerableMapUpgradeable.UintToUintMap internal _allEditionsMaxSupply;
    EnumerableMapUpgradeable.UintToUintMap internal _allEditionsCurrentSupplyMinted;
    EnumerableMapUpgradeable.UintToUintMap internal _allEditionsVersion;
    CountersUpgradeable.Counter internal _currentEditionsVersion;

    mapping(uint256 => EnumerableMapUpgradeable.AddressToUintMap) internal _allEditionPrices;

    struct BucketEditionParams {
        // 1, 2, 3, ...
        uint256 editionId;
        uint256 maxMintableSupply;
    }

    struct BucketEdition {
        uint256 editionId;
        bool active;
        uint256 maxMintableSupply;
        uint256 currentSupplyMinted;
    }

    struct EditionPrice {
        address currency;
        uint256 price;
    }

    event EditionUpdated(
        uint256 indexed editionId,
        uint256 indexed maxMintableSupply
    );

    event EditionPriceUpdated(
        uint256 indexed editionId,
        address indexed currency,
        uint256 indexed price
    );

    event BucketMinted(
        address indexed to,
        uint256 indexed editionId,
        uint256 indexed tokenId
    );

    event Withdraw(
        address indexed to,
        address indexed currency,
        uint256 indexed amount
    );

    function __BucketEditionUpgradable_init() internal onlyInitializing {
        
    }

    function __BucketEditionUpgradable_init_unchained() internal onlyInitializing {
    }

    function _isValid(BucketEditionParams memory edition) internal view virtual returns (bool) {
        return (edition.editionId >= MIN_EDITION_ID)
            && (edition.editionId <= MAX_EDITION_ID)
            && (edition.maxMintableSupply <= EDITION_MAX_MINTABLE_SUPPLY); 
    }

    function _requireActiveEdition(uint256 editionId) internal view {
        require(
            _allEditions.contains(editionId) && _allEditionsVersion.get(editionId) == _currentEditionsVersion.current(), 
            'Invalid or inactive edition'
        );
    }

    function _nextEditionTokenId(uint256 editionId) internal view returns (uint256) {
        uint256 supplyMinted = _allEditionsCurrentSupplyMinted.contains(editionId) ? _allEditionsCurrentSupplyMinted.get(editionId) : 0;
        return SafeMathUpgradeable.add(SafeMathUpgradeable.mul(editionId, EDITION_TOKEN_ID_FACTOR), supplyMinted);
    }

    function _editionTokenMinted(uint256 editionId) internal {
        uint256 supplyMinted = _allEditionsCurrentSupplyMinted.contains(editionId) ? _allEditionsCurrentSupplyMinted.get(editionId) : 0;
        _allEditionsCurrentSupplyMinted.set(editionId, supplyMinted + 1);
    }

    function setBucketEditions(BucketEditionParams[] calldata editions)
        external
        onlyRole(EDITIONS_ADMIN_ROLE) {
        _currentEditionsVersion.increment();
        uint256 version = _currentEditionsVersion.current();

        for (uint256 i = 0; i < editions.length; i++) {
            require(_isValid(editions[i]), 'Invalid bucket edition');

            BucketEditionParams memory edition = editions[i];
            _allEditions.add(edition.editionId);
            _allEditionsMaxSupply.set(edition.editionId, edition.maxMintableSupply);
            _allEditionsVersion.set(edition.editionId, version);
            // console.log('setBucketEditions, %s, edition id: %s, maxMintableSupply: %s', i, edition.editionId, edition.maxMintableSupply);

            emit EditionUpdated(edition.editionId, edition.maxMintableSupply);
        }
    }

    function getBucketEditions(bool activeOnly)
        public
        view
        returns (BucketEdition[] memory)
    {
        uint256 count = 0;
        uint256 currentVersion = _currentEditionsVersion.current();
        // console.log('getBucketEditions, currentVersion: %s', currentVersion);

        for (uint256 i = 0; i < _allEditions.length(); i++) {
            uint256 editionId = _allEditions.at(i);

            bool active = _allEditionsVersion.get(editionId) == currentVersion;
            uint256 currentSupplyMinted = _allEditionsCurrentSupplyMinted.contains(editionId) ? _allEditionsCurrentSupplyMinted.get(editionId) : 0;
            bool shouldInclude = active || (!activeOnly && currentSupplyMinted > 0);
            if (shouldInclude) {
                count++;
            }
        }
        // console.log('getBucketEditions, count: %s', count);

        BucketEdition[] memory editions = new BucketEdition[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _allEditions.length(); i++) {
            uint256 editionId = _allEditions.at(i);

            bool active = _allEditionsVersion.get(editionId) == currentVersion;
            uint256 currentSupplyMinted = _allEditionsCurrentSupplyMinted.contains(editionId) ? _allEditionsCurrentSupplyMinted.get(editionId) : 0;
            bool shouldInclude = active || (!activeOnly && currentSupplyMinted > 0);
            if (shouldInclude) {
                editions[index].editionId = editionId;
                editions[index].active = active;
                editions[index].maxMintableSupply = _allEditionsMaxSupply.get(editionId);
                editions[index].currentSupplyMinted = currentSupplyMinted;
                index++;
            }
        }

        return editions;
    }

    function setBucketEditionPrices(uint256 editionId, EditionPrice[] calldata prices)
        external
        onlyRole(EDITIONS_ADMIN_ROLE) 
    {
        _requireActiveEdition(editionId);

        EnumerableMapUpgradeable.AddressToUintMap storage editionPrices = _allEditionPrices[editionId];
        for (uint256 i = 0; i < editionPrices.length(); i++) {
            (address key, ) = editionPrices.at(i);
            editionPrices.remove(key);
        }

        for (uint256 i = 0; i < prices.length; i++) {
            editionPrices.set(prices[i].currency, prices[i].price);

            emit EditionPriceUpdated(editionId, prices[i].currency, prices[i].price);
        }
    }

    function getBucketEditionPrices(uint256 editionId)
        public
        view
        returns (EditionPrice[] memory)
    {
        _requireActiveEdition(editionId);

        EnumerableMapUpgradeable.AddressToUintMap storage editionPrices = _allEditionPrices[editionId];
        EditionPrice[] memory prices = new EditionPrice[](editionPrices.length());
        for (uint256 i = 0; i < editionPrices.length(); i++) {
            (address key, uint256 price) = editionPrices.at(i);
            prices[i].currency = key;
            prices[i].price = price;
        }
        return prices;
    }

    function withdraw(address to, address currency)
        external
        onlyRole(WITHDRAWER_ROLE) 
    {
        uint256 amount = 0;
        if (currency == CurrencyTransferLib.NATIVE_TOKEN) {
            amount = address(this).balance;
        }
        else {
            amount = IERC20Upgradeable(currency).balanceOf(address(this));
        }

        if (amount == 0) {
            return;
        }

        CurrencyTransferLib.transferCurrency(currency, address(this), to, amount);
        emit Withdraw(to, currency, amount);
    }


    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[46] private __gap;
}