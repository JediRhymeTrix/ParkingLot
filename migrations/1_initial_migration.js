var ParKingLot = artifacts.require("./ParkingLot.sol");

module.exports = function(deployer) {
    deployer.deploy(ParkingLot);
};