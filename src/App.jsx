import React, { useEffect, useState, } from "react";
import { ethers } from "ethers";
import { Modal } from "./modal.jsx";
import './App.css';
import abi from "./utils/WavePortal.json";
import moment from 'moment';

const App = () => {


  /*
  * Just a state variable we use to store our user's public wallet.
  */
  const [currentAccount, setCurrentAccount] = useState("");
  const [transactionMining, setTransactionMining] = useState(false);
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  
  // contract address - needs to be updated whenever we update solidity code
  const contractAddress = "0x243b1b540ddB318d8a6905719C4c7cb31bE758B5";
  const contractABI = abi.abi;

  // open modal function
  const openModal = () => {
    setShowModal(prev => !prev);
  }

  // checks if Metamask is connected
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      
      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  // implement connectWallet method
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert ("Get MetaMask!");
        return;
      }

    const accounts = await ethereum.request({method: "eth_requestAccounts"});

    console.log("Connected", accounts[0]);
    setCurrentAccount(accounts[0]);
    getAllWaves();
    } catch (error) {
      console.log(error);
    }
  }

    useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  // wave
  const wave = async () => {
    try { // get metamask connection
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        let count = await wavePortalContract.getTotalWaves();

        console.log("Retrieved total wave count...", count.toNumber());

        // Execute wave from smart contract with gasLimit to minimize failure
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 3000000 });
        setTransactionMining(true); // set transaction mining to true to help with HTML below
        
        // retrieve randomly generated seed from solidity
        let seed = await wavePortalContract.getSeed();
        console.log(seed.toNumber());

        // if seed is <=50, open the modal
        if (seed.toNumber() <= 50) {
          openModal();
        }


        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        setTransactionMining(false);
        console.log("Mined -- ", waveTxn.hash);



        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  // get all waves from solidity
  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await wavePortalContract.getAllWaves();

        // create wave map with message info
        const wavesCleaned = waves.map(wave => {
            return {
              address: truncateAddress(wave.waver),
              timestamp: new Date(wave.timestamp * 1000),
              message: wave.message,
            };
        });
        
        // sort the transactions by time (most recent up top)
        wavesCleaned.sort((a, b) => b.timestamp - a.timestamp);
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // listen in for emitter events
  useEffect(() => {
    let wavePortalContract;

    // update the state immediately on new wave to show message
    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave', from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: truncateAddress(from),
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, []);
    
    // small function to truncate sender address
  	const truncateAddress = (s) => {
		return `${s.substring(0, 6)}...${s.substring(38, s.length)}`
	}



  return (
    <div className="mainContainer">
      <div className="dataContainer">
          <div className="noselect header">
            👋 Hey there!
          </div>
      
          <div className="noselect bio" >
            <h2>I'm Eddie and I'm learning how to develop for Web3. Ponder the rabbit hole and send a message!</h2>
          </div>

          {/*
          * If there is no currentAccount render this button
          */}
          {!currentAccount ? 
          (
            <button className="no select waveButton"  onClick={connectWallet}>
              Connect Wallet
            </button>
          )
          : (
            <div>
              {/*textarea contains info for message box. 100 character max length message and placeholder message are defined */}
              <textarea className="noselect" maxLength="100" rows="3" value={message} placeholder="Type your message" onChange={e => setMessage(e.target.value)}/>
                <div className="noselect char">{message.length} / 100</div>

                <button className="noselect waveButton" onClick={() => {wave(); }} disabled={transactionMining}>
                  {/* if transaction mining is true, displays the below*/}
                  {transactionMining && <span className="noselect">woohoo! Sending to the blockchain</span>}
                  {/* if transaction mining is false, displays the below*/}
                  {!transactionMining && <span className="noselect">send message!</span>}
                </button>

                { /* show modal if true */}  
                <Modal showModal={showModal} setShowModal={setShowModal} />

                {/* shows the messages on the blockchain */}
                <h2 className="noselect"> {allWaves.length} Messages on the blockchain</h2>
                  <div className="noselect Txn">
                    <table className="waveTable">
                      <thead>
                        <tr>
                          <th > Sender</th>
                          <th > Message</th>
                          <th className="waveTable_colSent"> Sent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allWaves.map((wave, index) => {
                          return (
                            <tr key={index} className="waveTable_Tr">
                              <td className="waveTable_sender">{wave.address}</td>
                              <td className="waveTable_sent">{wave.message}</td>
                              <td className="waveTable_msg">{moment(wave.timestamp).fromNow()}</td>
                            </tr>)
                        })}
                      </tbody>
                    </table>
                  </div>
            </div>
            )
          }
        </div>
      </div>
    );
  }
export default App