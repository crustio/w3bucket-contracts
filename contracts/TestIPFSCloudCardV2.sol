// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "./IPFSCloudCard.sol";

contract TestIPFSCloudCardV2 is IPFSCloudCard {
  using StringsUpgradeable for uint256;

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    _requireMinted(tokenId);

    string memory baseURI = "https://api.ipfs.studio/ipfscloudcardv2/";
    return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
}
}