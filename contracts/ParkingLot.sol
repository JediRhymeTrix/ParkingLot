pragma solidity ^ 0.4 .4;

contract ParkingLot {
    mapping(uint => address) public registeredVehicles;
    mapping(uint => uint) public checkInTime;
    mapping(uint => bool) public isParked;
    mapping(uint => uint) public checkOutTime;
    mapping(address => uint) public payments;
    mapping(uint => uint) public diff;

    uint[] history;

    //payment variables

    address owner;

    function ParkingLot() {
        owner = msg.sender;
        history = new uint[](4);
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
        if (checkInTime[vNo] != uint(0x0) || !isRegistered(vNo) || isParked[vNo])
            return;
        checkInTime[vNo] = inTime;
        isParked[vNo] = true;
    }

    function checkOut(uint vNo, uint outTime) public {
        if (checkInTime[vNo] == uint(0x0) || checkInTime[vNo] > outTime || !isParked[vNo]) {
            diff[vNo] = 0;
            return;
        }

        checkOutTime[vNo] = outTime;
        isParked[vNo] = false;

        diff[vNo] = checkOutTime[vNo] - checkInTime[vNo];
    }

    function makePayment(uint vNo) public payable returns(uint[] history) {
        payments[msg.sender] = msg.value;

        history[0] = checkInTime[vNo];
        history[1] = checkOutTime[vNo];
        history[2] = vNo;
        history[3] = msg.value;

        return history;
    }

    function destroy() public {
        if (msg.sender == owner)
            suicide(owner);
    }
}