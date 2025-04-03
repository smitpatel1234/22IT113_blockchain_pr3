App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: async function() {
    console.log("App initialized...");
    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Connected to MetaMask:", accounts[0]);
        App.account = accounts[0];
        
        // Check network
        const networkId = await window.ethereum.request({ method: 'net_version' });
        console.log("Connected to network ID:", networkId);
        
        // Accept both Ganache network IDs
        if (networkId !== '5777' && networkId !== '1337') {
          alert("Please connect MetaMask to Localhost:7545 network for this dApp to work properly");
        }
        
      } catch (error) {
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    } 
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    return App.initContracts();
  },

  initContracts: function() {
    // Debug info before loading contracts
    console.log("Loading contracts...");
   
      
      // DEBUGGING: Log specific paths we're checking
      console.log("Checking for contract at: " + window.location.href + "SmitPatelToken.json");
      
      $.getJSON("SmitPatelToken.json", function(token) {
        App.contracts.SmitPatelToken = TruffleContract(token);
        App.contracts.SmitPatelToken.setProvider(App.web3Provider);
        
        $.getJSON("SmitPatelTokenSale.json", function(tokenSale) {
          App.contracts.SmitPatelTokenSale = TruffleContract(tokenSale);
          App.contracts.SmitPatelTokenSale.setProvider(App.web3Provider);
          
          console.log("Both contracts loaded successfully!");
          
          // Get deployed addresses to verify
          App.contracts.SmitPatelToken.deployed().then(function(instance) {
            console.log("Token contract address:", instance.address);
          }).catch(function(err) {
            console.error("Failed to get token address:", err);
          });
          
          App.contracts.SmitPatelTokenSale.deployed().then(function(instance) {
            console.log("Token sale contract address:", instance.address);
          }).catch(function(err) {
            console.error("Failed to get token sale address:", err);
          });
          
          App.listenForEvents();
          return App.render();
        }).fail(function(error) {
          console.error("Could not load SmitPatelTokenSale.json:", error);
        });
      }).fail(function(error) {
        console.error("Could not load SmitPatelToken.json:", error);
      });
    
    
    // Try multiple paths for JSON files
    $.getJSON("SmitPatelTokenSale.json")
      .done(function(SmitPatelTokenSale) {
        console.log("Found SmitPatelTokenSale.json in root");
        processTokenSaleContract(SmitPatelTokenSale);
      })
      .fail(function() {
        $.getJSON("build/contracts/SmitPatelTokenSale.json")
          .done(function(SmitPatelTokenSale) {
            console.log("Found SmitPatelTokenSale.json in build/contracts");
            processTokenSaleContract(SmitPatelTokenSale);
          })
          .fail(function() {
            $.getJSON("../build/contracts/SmitPatelTokenSale.json")
              .done(function(SmitPatelTokenSale) {
                console.log("Found SmitPatelTokenSale.json in ../build/contracts");
                processTokenSaleContract(SmitPatelTokenSale);
              })
              .fail(function(error) {
                console.error("Could not find SmitPatelTokenSale.json");
              });
          });
      });
      
    function processTokenSaleContract(SmitPatelTokenSale) {
      App.contracts.SmitPatelTokenSale = TruffleContract(SmitPatelTokenSale);
      App.contracts.SmitPatelTokenSale.setProvider(App.web3Provider);
      
      // Now load token contract
      $.getJSON("SmitPatelToken.json")
        .done(function(SmitPatelToken) {
          console.log("Found SmitPatelToken.json in root");
          processTokenContract(SmitPatelToken);
        })
        .fail(function() {
          $.getJSON("build/contracts/SmitPatelToken.json")
            .done(function(SmitPatelToken) {
              console.log("Found SmitPatelToken.json in build/contracts");
              processTokenContract(SmitPatelToken);
            })
            .fail(function() {
              $.getJSON("../build/contracts/SmitPatelToken.json")
                .done(function(SmitPatelToken) {
                  console.log("Found SmitPatelToken.json in ../build/contracts");
                  processTokenContract(SmitPatelToken);
                })
                .fail(function(error) {
                  console.error("Could not find SmitPatelToken.json");
                });
            });
        });
    }
    
    function processTokenContract(SmitPatelToken) {
      App.contracts.SmitPatelToken = TruffleContract(SmitPatelToken);
      App.contracts.SmitPatelToken.setProvider(App.web3Provider);
      
      console.log("Contracts loaded successfully");
      App.listenForEvents();
      return App.render();
    }
  },

  listenForEvents: function() {
    App.contracts.SmitPatelTokenSale.deployed().then(function(instance) {
      console.log("Setting up event listeners...");
      try {
        instance.Sell({}, {
          fromBlock: 0,
          toBlock: 'latest',
        }).watch(function(error, event) {
          console.log("event triggered", event);
          App.render();
        });
      } catch(error) {
        console.log("Using newer web3 version - listening differently");
        // For web3 1.0+
        try {
          instance.getPastEvents('Sell', {
            fromBlock: 0,
            toBlock: 'latest'
          }, function(error, events) {
            console.log("Past events:", events);
          });
          
          instance.events.Sell({
            fromBlock: 'latest'
          }, function(error, event) {
            console.log("New event triggered", event);
            App.render();
          });
        } catch (e) {
          console.log("Event listening error:", e);
        }
      }
    }).catch(function(err) {
      console.error("Error listening for events:", err);
    });
  },

  render: async function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    console.log("Rendering UI...");
    var loader = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    // Get current account
    try {
      if (!App.account && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          App.account = accounts[0];
        }
      }
      
      if (App.account) {
        $('#accountAddress').html("Your Account: " + App.account);
      } else {
        $('#accountAddress').html("Please connect to MetaMask");
      }
    } catch (error) {
      console.error("Could not get accounts", error);
      // Try legacy approach
      try {
        web3.eth.getCoinbase(function(err, account) {
          if (err === null && account) {
            App.account = account;
            $('#accountAddress').html("Your Account: " + account);
          }
        });
      } catch (e) {
        console.error("Legacy account fetch error:", e);
      }
    }

    // Don't proceed if we don't have contracts loaded
    if (!App.contracts.SmitPatelTokenSale || !App.contracts.SmitPatelToken) {
      console.error("Contracts not loaded yet");
      App.loading = false;
      loader.hide();
      $('#content').html('<p class="text-center">Loading contracts... Please wait or refresh the page.</p>');
      $('#content').show();
      return;
    }

    App.contracts.SmitPatelTokenSale.deployed().then(function(instance) {
      console.log("Getting token sale info...");
      tokenSaleInstance = instance;
      return tokenSaleInstance.tokenPrice();
    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;
      // Use the proper fromWei method for your web3 version
      try {
        $('.token-price').html(web3.utils.fromWei(tokenPrice.toString(), "ether"));
      } catch (e) {
        try {
          $('.token-price').html(web3.fromWei(tokenPrice, "ether").toNumber());
        } catch (err) {
          $('.token-price').html("0.001"); // Fallback value
        }
      }
      return tokenSaleInstance.tokensSold();
    }).then(function(tokensSold) {
      try {
        App.tokensSold = tokensSold.toNumber ? tokensSold.toNumber() : parseInt(tokensSold);
        $('.tokens-sold').html(App.tokensSold);
        $('.tokens-available').html(App.tokensAvailable);

        var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
        $('#progress').css('width', progressPercent + '%');

        return App.contracts.SmitPatelToken.deployed();
      } catch (e) {
        console.error("Error processing token sale data:", e);
        throw e;
      }
    }).then(function(instance) {
      console.log("Getting token balance...");
      tokenInstance = instance;
      return tokenInstance.balanceOf(App.account);
    }).then(function(balance) {
      try {
        let balanceValue = balance.toNumber ? balance.toNumber() : parseInt(balance);
        $('.SmitPatel-balance').html(balanceValue);
      } catch (e) {
        console.error("Error displaying balance:", e);
        $('.SmitPatel-balance').html("Error loading balance");
      }
      
      App.loading = false;
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.error("Error in render:", error);
      App.loading = false;
      loader.hide();
      $('#content').html('<p class="text-center">Error loading contract data. Please make sure MetaMask is connected to the correct network and refresh the page.</p>');
      $('#content').show();
    });
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    console.log("Buying " + numberOfTokens + " tokens...");
    
    App.contracts.SmitPatelTokenSale.deployed().then(function(instance) {
      // Calculate the value properly with BN to avoid overflow issues
      let value;
      try {
        // For web3 1.0+
        value = web3.utils.toBN(numberOfTokens).mul(web3.utils.toBN(App.tokenPrice));
      } catch (e) {
        // For older web3
        value = numberOfTokens * App.tokenPrice;
      }
      
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: value.toString(),
        gas: 500000 
      });
    }).then(function(result) {
      console.log("Tokens bought...", result);
      $('form').trigger('reset');
      // Wait for events to trigger render
      setTimeout(function() {
        App.render();
      }, 1000);
    }).catch(function(error) {
      console.error("Error buying tokens:", error);
      $('#loader').hide();
      $('#content').show();
      alert("There was an error buying tokens. See console for details.");
    });
  },

  // Function to manually transfer tokens
  transferTokens: function() {
    const recipient = prompt("Enter the recipient address:");
    if (!recipient) return;
    
    try {
      // Check address validity
      if (web3.utils && web3.utils.isAddress) {
        if (!web3.utils.isAddress(recipient)) {
          alert("Invalid Ethereum address");
          return;
        }
      }
    } catch (e) {
      console.log("Address validation skipped:", e);
    }
    
    const amount = prompt("Enter the amount of tokens to transfer:");
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    $('#content').hide();
    $('#loader').show();
    
    console.log(`Transferring ${amount} tokens to ${recipient}...`);
    
    App.contracts.SmitPatelToken.deployed().then(function(instance) {
      return instance.transfer(recipient, parseInt(amount), {
        from: App.account,
        gas: 100000
      });
    }).then(function(result) {
      console.log("Tokens transferred successfully:", result);
      alert(`Successfully transferred ${amount} tokens to ${recipient}`);
      setTimeout(function() {
        App.render();
      }, 1000);
    }).catch(function(error) {
      console.error("Error transferring tokens:", error);
      alert("Error transferring tokens: " + (error.message || error));
      $('#loader').hide();
      $('#content').show();
    });
  }
}

$(function() {
  $(window).on("load", function() {
    App.init();
    
    // Add transfer button to UI if not already present
    setTimeout(function() {
      if ($('#transferButton').length === 0) {
        $('#content').append(`
          <div class="text-center" style="margin-top: 20px;">
            <button id="transferButton" onclick="App.transferTokens()" class="btn btn-success">Transfer Tokens</button>
          </div>
        `);
      }
    }, 1000);
  });
});