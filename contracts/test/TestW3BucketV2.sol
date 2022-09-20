// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "../W3Bucket.sol";

contract TestW3BucketV2 is W3Bucket {
  using StringsUpgradeable for uint256;

  function _baseURI() internal view override returns (string memory) {
      return "https://api.ipfs.studio/w3bucketv2/";
  }
}