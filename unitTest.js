// ------------------------ //
//         IMPORTS          //
// ------------------------ //
const reception = require('./src/handler/receptionScoreHandler');
const logger = require('./src/managers/logManager');

// ------------------------ //
//        CONSTANTES        //
// ------------------------ //
let nbTests;
let nbTestsPassed;

const DEFAULT_DATA = {
    numMatch: '1',
    category: 'Category',
    round: 'Round',
    duration: '00:00',
    player1: 'J1',
    player2: 'J2',
    server1: '0',
    server2: '1',
    player1Set1: '0',
    player1Set2: '',
    player1Set3: '',
    player2Set1: '1',
    player2Set2: '',
    player2Set3: '',
    winner: '',
    liveCompleted: 'Live'
};


// ------------------------ //
//        PROGRAMME         //
// ------------------------ //

runAllTests();

async function runAllTests() {
    await runTestsForFunction(
        reception.getSetWinner,
        [
            {  expected: null, args: [0, 0] },
            {  expected: null, args: [5, 0] },
            {  expected: null, args: [0, 5] },
            {  expected: null, args: [16, 17] },
            {  expected: null, args: [17, 16] },
            {  expected: 1, args: [18, 16] },
            {  expected: 2, args: [16, 18] },
            {  expected: 1, args: [16, 13] },
        ]
    );

    await runTestsForFunction(
        reception.getMatchWinner,
        [
            {  expected: null, args: [{ ...DEFAULT_DATA }] },
            {  expected: null, args: [{ ...DEFAULT_DATA, player1Set1: 16, player2Set1: 18 }] },
            {  expected: null, args: [{ ...DEFAULT_DATA, player1Set1: 18, player2Set1: 16 }] },
            {  expected: 'J1', args: [{ ...DEFAULT_DATA, player1Set1: 18, player2Set1: 16, player1Set2: 16, player2Set2: 13 }] },
            {  expected: 'J2', args: [{ ...DEFAULT_DATA, player1Set1: 16, player2Set1: 18, player1Set2: 13, player2Set2: 16 }] },
            {  expected: 'J1', args: [{ ...DEFAULT_DATA, player1Set1: 18, player2Set1: 16, player1Set2: 13, player2Set2: 16, player1Set3: 16, player2Set3: 14 }] },
            {  expected: 'J2', args: [{ ...DEFAULT_DATA, player1Set1: 18, player2Set1: 16, player1Set2: 13, player2Set2: 16, player1Set3: 14, player2Set3: 16 }] },
        ]
    );


    await runTestsForFunction(
        
    );
}

async function runTestsForFunction(fonction, tests) {
    logger.info(`-------------------------`);
    logger.info(`Running tests for ${fonction.name}...`);
    nbTests = 0;
    nbTestsPassed = 0;
    
    for (let test of tests) {
        nbTests++;
        if (await execTest(nbTests, test.expected, fonction, ...test.args)) {
            nbTestsPassed++;
        }
    }

    logger.info(`>> Tests completed for ${fonction.name}. Passed: ${nbTestsPassed}/${nbTests}`);
}

async function execTest(testId, resultatAttendu, fonction, ...args) {
    let resultat = fonction(...args);
    
    if (resultat === resultatAttendu) {
        logger.info(`| Test ${fonction.name} #${testId} passed = ${resultat}`);
        return true;
    } else {
        logger.error(`| Test ${fonction.name} #${testId} failed = ${resultat}. Expected: ${resultatAttendu}`);
        return false;
    }
}