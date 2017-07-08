pragma solidity ^ 0.4 .4;

contract ParkingLot {
    mapping(uint => address) public registeredVehicles;
    mapping(uint => uint) public checkInTime;
    mapping(uint => bool) public isParked;
    mapping(uint => uint) public checkOutTime;
    mapping(address => uint) public payments;

    //payment variables

    uint public diff = 0;
    address owner;

    function ParkingLot() {
        owner = msg.sender;
    }

    function isRegistered(uint vNo) public returns(bool status) {
        if (registeredVehicles[vNo] == address(0))
            return false;
        return true;
    }

    function getRegistered(uint vNo) public {
        if (isRegistered(vNo))
            return;
        registeredVehicles[vNo] = msg.sender;
    }

    function checkIn(uint vNo, uint inTime) public {
        if (checkInTime[vNo] != uint(0x0) || !isRegistered(vNo))
            return;
        checkInTime[vNo] = inTime;
        isParked[vNo] = true;
    }

    function checkOut(uint vNo, uint outTime) public payable {
        if (checkInTime[vNo] == uint(0x0) || checkInTime[vNo] < outTime)
            return;
        checkOutTime[vNo] = outTime;
        isParked[vNo] = false;
        //payment logic
        payments[msg.sender] = msg.value;
    }

    function getTimeDifference(uint vNo) public {
        if (!isParked[vNo] || checkOutTime[vNo] - checkInTime[vNo] <= uint(0x0))
            diff = uint(0x0);
        diff = checkOutTime[vNo] - checkInTime[vNo];
    }

    function destroy() public {
        if (msg.sender == owner)
            suicide(owner);
    }
}