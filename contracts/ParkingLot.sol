pragma solidity ^ 0.4 .4;

contract ParkingLot {
  address public organizer;
  address public speaker;

  mapping(address => uint) public registrantsPaid;
  mapping(address => uint) public ratingGiven;
  mapping(uint => uint) public ratings;

  uint public quota;
  uint public price;

  string public location;

  uint public numRegistrants;

  // Constructor
  function ParkingLot(address spk) {
    organizer = msg.sender;
    quota = 500;
    numRegistrants = 0;
    price = 1;
    speaker = spk;
    location = 'Hyderabad';
  }

  function changeQuota(uint newquota) public {
    if (msg.sender != organizer) {
      return;
    }
    quota = newquota;
  }

  function changeLocation(string newLocation) public {
    if (msg.sender != organizer) {
      return;
    }

    location = newLocation;
  }

  function buyTicket() public payable returns(bool success) {
    if (numRegistrants >= quota) {
      return false;
    }
    registrantsPaid[msg.sender] = msg.value;
    numRegistrants++;
    return true;
  }

  function buyMultipleTickets(uint num) public payable returns(bool success) {
    if (numRegistrants >= quota) {
      return false;
    }
    registrantsPaid[msg.sender] = msg.value;
    numRegistrants = numRegistrants + num;
    return true;
  }

  function refundTicket(address recipient, uint amount) public {
    if (msg.sender != organizer) {
      return;
    }
    if (registrantsPaid[recipient] == amount) {
      address myAddress = this;
      if (myAddress.balance >= amount) {
        if (!recipient.send(amount)) throw;
        registrantsPaid[recipient] = 0;
        numRegistrants--;
      }
    }
  }

  function setRating(uint rating) public {
    if (msg.sender == organizer || msg.sender == speaker || registrantsPaid[msg.sender] == uint(0x0) || ratingGiven[msg.sender] != uint(0x0)) {
      return;
    }

    if (ratings[rating] == uint(0x0)) {
      ratings[rating] = 0;
    }

    ratings[rating] = ratings[rating] + 1;
    ratingGiven[msg.sender] = rating;
  }

  function destroy() { // so funds not locked in contract forever
    if (msg.sender == organizer) {
      address myAddress = this;
      if (!speaker.send(((myAddress.balance) * (80)) / 100)) throw;
      suicide(organizer); // send funds to organizer
    }
  }

} //end of conference