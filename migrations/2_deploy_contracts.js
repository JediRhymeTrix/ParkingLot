var ParkingLot = artifacts.require("./ParkingLot.sol");

module.exports = function(deployer) {
    deployer.deploy(ParkingLot);
};