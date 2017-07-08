// Import the page's CSS. Webpack will know what to do with it.
import '../stylesheets/app.css'

// Import libraries we need.
import {
    default as Web3
} from 'web3'
import {
    default as contract
} from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import parkingLot_artifacts from '../../build/contracts/ParkingLot.json'

// Conference is our usable abstraction, which we'll use through the code below.

// var Conference = contract(parkingLot_artifacts)
var ParkingLot = contract(parkingLot_artifacts)
var accounts, account
var parkingLot

function getBalance(address) {
    return web3.fromWei(web3.eth.getBalance(address).toNumber(), 'ether')
}

window.App = {
    start: function() {
        var self = this

        web3.eth.getAccounts(function(err, accs) {
            if (err != null) {
                alert('There was an error fetching your accounts.')
                return
            }

            if (accs.length == 0) {
                alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.")
                return
            }

            accounts = accs
            account = accounts[0]
            self.initializeParkingLot()
        })
    },

    initializeParkingLot: function() {
        var self = this
        ParkingLot.deployed().then(function(instance) {
            parkingLot = instance
            $('#contAddress').html(parkingLot.address)
            $('#contBalance').html(getBalance(parkingLot.address))
        })

        $.loadAddresses()
    },

    changeQuota: function(val) {
        var conference
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.changeQuota(val, {
                from: accounts[0]
            }).then(
                function() {
                    return conference.quota.call()
                }).then(
                function(quota) {
                    var msgResult
                    if (quota == val) {
                        msgResult = 'Change successful'
                    } else {
                        msgResult = 'Change failed'
                    }
                    $('#changeQuotaResult').html(msgResult)
                })
        }).catch(function(e) {
            console.log(e)
        })
    },

    changeLocation: function(val) {
        var conference
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.changeLocation(val, {
                from: accounts[0]
            }).then(
                function() {
                    return conference.location.call();
                }).then(
                function(location) {
                    var msgResult
                    if (location == val) {
                        msgResult = 'Change successful'
                        $('#location').val(val)
                    } else {
                        msgResult = 'Change failed'
                    }
                    $('#changeLocationResult').html(msgResult)
                })
        }).catch(function(e) {
            console.log(e)
        })
    },

    addVehicle: function(owner, vNum) {
        var self = this
        ParkingLot.deployed().then(function(instance) {
            parkingLot = instance


            parkingLot.registeredVehicles.call(vNum).then(
                function(status) {
                    console.log(status)
                    if (status != "0x0000000000000000000000000000000000000000")
                        $('#addVehicleResult').html("Already Registered")
                    else {
                        parkingLot.getRegistered(vNum, {
                            from: owner
                        }).then(
                            function() {
                                parkingLot.registeredVehicles.call(vNum).then(
                                    function(vAddress) {
                                        console.log(vAddress)
                                        console.log(owner)
                                        if (vAddress == owner) {
                                            $('#addVehicleResult').html("Registered Sucessfully")
                                            $.addRegistered(vNum, owner);
                                        } else
                                            $('#addVehicleResult').html("Registeration Failed")
                                    })
                            })
                    }
                })
        }).catch(function(e) {
            console.log(e)
        })
    },

    checkIn: function(vNum, time) {
        var self = this
        ParkingLot.deployed().then(function(instance) {
            parkingLot = instance
            parkingLot.isParked.call(vNum).then(
                function(status) {
                    console.log(status)
                    if (status)
                        $('#checkinResult').html('Already Checked In at : ' + time)
                    else {
                        parkingLot.checkIn(vNum, time, {
                            from: accounts[0]
                        }).then(
                            function() {
                                return parkingLot.checkInTime.call(vNum)
                            }).then(
                            function(storedInTime) {
                                if (time == storedInTime) {
                                    $('#checkinResult').html('Checked In Sucessful at : ' + time)
                                    $.addCheckIn(vNum, storedInTime);
                                } else if (storedInTime == 0)
                                    $('#checkinResult').html('Vehicle Not Registered')
                            })
                    }
                })
        }).catch(function(e) {
            console.log(e)
        })
    },

    checkOut: function(vNum, offerCode, time) {
        var self = this
        ParkingLot.deployed().then(function(instance) {
            parkingLot = instance
            parkingLot.getTimeDifference(vNum, {
                    from: accounts[0]
                })
                .then(
                    function(timeDiff) {
                        console.log(timeDiff);
                        timeDiff = timeDiff.toNumber() * 0.6
                        var amt, discount

                        if (timeDiff = 0)
                            return -1

                        if (timeDiff < 60) amt = 5
                        else if (timeDiff < 180) amt = 10
                        else amt = 30

                        switch (offerCode) {
                            case 'shop50':
                                amt -= amt * .5
                                break
                            case 'mov10':
                                amt -= amt * .01
                                break
                            default:
                                break
                        }

                        return amt
                    })
                .then(
                    function(amount) {
                        if (amount == -1) {
                            $('#checkOutResult').html('Car has not been checked in yet!')
                            $('#checkOutResult').show()
                        } else {
                            $('#checkOutResult').hide()
                            $('#amt').val(amount)
                            $('#payment').show()
                        }
                    }
                )
        }).catch(function(e) {
            console.log(e)
        })
    },

    refundTicket: function(buyerAddress, ticketPrice) {
        var self = this
        Conference.deployed().then(function(instance) {
            conference = instance
            var msgResult

            conference.registrantsPaid.call(buyerAddress).then(
                function(result) {
                    if (result.toNumber() == 0) {
                        $('#refundTicketResult').html('Buyer is not registered - no refund!')
                    } else {
                        conference.refundTicket(buyerAddress,
                            ticketPrice, {
                                from: accounts[0]
                            }).then(
                            function() {
                                return conference.numRegistrants.call()
                            }).then(
                            function(num) {
                                $('#numRegistrants').html(num.toNumber())
                                return conference.registrantsPaid.call(buyerAddress)
                            }).then(
                            function(valuePaid) {
                                if (valuePaid.toNumber() == 0) {
                                    msgResult = 'Refund successful'
                                } else {
                                    msgResult = 'Refund failed'
                                }
                                $('#refundTicketResult').html(msgResult)
                            }).then(
                            function() {
                                $('#confBalance').html(getBalance(conference.address))
                            })
                    }
                })
        }).catch(function(e) {
            console.log(e)
        })
    }, // end of refund

    setRating: function(buyerAddress, rating) {
        var self = this
        var initial_rating = rating
        console.log('initial rating: ' + initial_rating)
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.setRating(rating, {
                from: buyerAddress,
            }).then(
                function() {
                    return conference.ratingGiven.call(buyerAddress)
                        .then(
                            function(contract_rating) {
                                var msgResult
                                console.log('contract rating: ' + contract_rating.toNumber())
                                if (contract_rating.toNumber() == initial_rating) {
                                    msgResult = 'Rating submitted'
                                    $.drawRatingGraph()
                                } else {
                                    msgResult = 'Rating submission failed'
                                }
                                $('#ratingResult').html(msgResult)
                            })
                }).catch(function(e) {
                console.log(e)
            })
        })
    },

    getVal: function(rating) {
        var self = this
        var count
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.ratings.call(rating)
                .then(
                    function(cnt) { // TODO: Find a way to make this happen synchronously
                        console.log('cnt: ' + cnt.toNumber())
                        count = cnt
                    })
        }).catch(function(e) {
            console.log(e)
        })

        console.log('count: ' + count)
        return count
    },

    destroyContract: function() {
        var self = this
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.destroy({
                    from: accounts[0]
                }).then(
                    function() {
                        $('#destroyContractResult').html('contract destroyed. pls refresh page to reflect balance')
                    }) // end of conference destroy
        }).catch(function(e) {
            console.log(e)
        })
    },

}

window.addEventListener('load', function() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
            // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider)
    } else {
        console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
            // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
    }

    ParkingLot.setProvider(web3.currentProvider)
    App.start()

    $('#addVehicle').click(function() {
        var vNum = $('#vnum').val()
        var owner = $('#owner').val()
        App.addVehicle(owner, vNum)
    })

    $('#check-in').click(function() {
        var vNum = $('#vnum-chkin').val()
        var time = $('#time-chkin').val()
        App.checkIn(vNum, time)
    })

    $('#check-out').click(function() {
        var vNum = $('#vnum-chkout').val()
        var offerCode = $('#offerCode').val()
        var time = $('#time-chkout').val()

        App.checkOut(vNum, offerCode, time)
    })

    $('#refundTicket').click(function() {
        var val = $('#ticketPrice').val()
        var buyerAddress = $('#refBuyerAddress').val()
        App.refundTicket(buyerAddress, web3.toWei(val))
    })
    $('#setRating').click(function() {
        var val = $('#rating').text()
        var buyerAddress = $('#ratingAddress').val()
        $.drawRatingGraph() // here for testing

        if (buyerAddress.length != 42)
            $('#ratingResult').html('Please enter a valid address')
        else
            App.setRating(buyerAddress, val)
    })
    $('#destroyContract').click(function() {
        App.destroyContract()
    })

    $.loadAddresses = function() {
        var index = 0

        accounts.forEach(function(element) {
            $('#addressTable').append('<tr><td>' + (index++) + '</td><td>' + element + '</td></tr>')
        }, this);
    }

    $.addRegistered = function(vNum, owner) {
        $('#carsTable').append('<tr><td>' + vNum + '</td><td>' + owner + '</td></tr>')
    }

    $.addCheckIn = function(vNum, time) {
        $('#checkinTable').append('<tr><td>' + time + '</td><td>' + vNum + '</td></tr>')
    }

    $.addHistory = function() {

    }
})