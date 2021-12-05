// run.js - used for testing solidity code

const main = async () => {
    // create Contract variables
    const waveContractFactory = await hre.ethers.getContractFactory('WavePortal');
    const waveContract = await waveContractFactory.deploy({
        value: hre.ethers.utils.parseEther('0.5'),
    });

    // deploy waveContract and get Contract address
    await waveContract.deployed();
    console.log("Contract addy:", waveContract.address);

    // Get Contract balance
    let contractBalance = await hre.ethers.provider.getBalance(
        waveContract.address
    );
    console.log('Contract balance:',
    hre.ethers.utils.formatEther(contractBalance)
    );

    // get waveCount
    let waveCount;
    waveCount = await waveContract.getTotalWaves();
    console.log(waveCount.toNumber());

    // process first Wave transaction
    let waveTxn = await waveContract.wave('Wave 1');
    await waveTxn.wait();
    let seedNum = await waveContract.getSeed();
    console.log(seedNum.toNumber());

    // contract balance to see what happened
    contractBalance = await hre.ethers.provider.getBalance(waveContract.address);
    console.log('Contract balance:',
    hre.ethers.utils.formatEther(contractBalance)
    );

    // test a second wave
    let waveTxn2 = await waveContract.wave('Wave 2');
    await waveTxn2.wait();
    seedNum = await waveContract.getSeed();
    console.log(seedNum.toNumber());

    // test a 3rd wave
    const [_, randomPerson] = await hre.ethers.getSigners();
    waveTxn = await waveContract.connect(randomPerson).wave('Another message!');
    await waveTxn.wait();

    // contract balance to see what happened
    contractBalance = await hre.ethers.provider.getBalance(waveContract.address);
    console.log(
        'Contract balance:',
        hre.ethers.utils.formatEther(contractBalance)
    );    

};

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

runMain();

