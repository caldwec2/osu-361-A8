const axios = require('axios');
const readline = require('readline');

// Config
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Wait for user input
function waitForEnter(message = "Press Enter to continue...") {
    return new Promise(resolve => {
        rl.question(`\n${message}`, () => {
            resolve();
        });
    });
}

// Wait for specific number of seconds
function delay(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Print responses
function prettyPrint(response) {
    try {
        const data = response.data || response;
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.log(`Status: ${response.status || 'Unknown'}`);
        console.log(`Response: ${response.statusText || response.toString()}`);
    }
}

class InteractiveTestDemo {
    constructor() {
        this.testCount = 0;
        this.mode = 'interactive'; // 'interactive', 'auto-slow', 'manual'
    }

    async showWelcome() {
        console.clear();
        console.log('VACATION RECOMMENDATION MICROSERVICE');
        console.log('    VIDEO DEMONSTRATION MODE');
        console.log('=' .repeat(55));
        console.log('Testing API at: ' + API_BASE);
        console.log('=' .repeat(55));
        console.log();

        console.log('Choose demonstration mode:');
        console.log('1. Interactive Mode (wait for Enter between tests)');
        console.log('2. Auto-Slow Mode (3-second delays between tests)');
        console.log('3. Manual Mode (run individual tests)');
        console.log();
    }

    async selectMode() {
        return new Promise(resolve => {
            rl.question('Select mode (1, 2, or 3): ', (answer) => {
                switch(answer.trim()) {
                    case '1':
                        this.mode = 'interactive';
                        break;
                    case '2':
                        this.mode = 'auto-slow';
                        break;
                    case '3':
                        this.mode = 'manual';
                        break;
                    default:
                        this.mode = 'interactive';
                }
                resolve();
            });
        });
    }

    async waitBetweenTests() {
        switch(this.mode) {
            case 'interactive':
                await waitForEnter();
                break;
            case 'auto-slow':
                console.log('Waiting 3 seconds...');
                await delay(3);
                break;
            case 'manual':
                await waitForEnter('Press Enter to run this test...');
                break;
        }
    }

    async runTest(testName, testFunction) {
        this.testCount++;

        console.log('\n' + '-'.repeat(60));
        console.log(`Test ${this.testCount}: ${testName}`);
        console.log('-'.repeat(60));

        if (this.mode === 'manual') {
            await waitForEnter(`Ready to run "${testName}"? Press Enter...`);
        }

        try {
            await testFunction();
            console.log('Test completed successfully');
        } catch (error) {
            console.log('Test failed: ' + error.message);
        }

        await this.waitBetweenTests();
    }

    async testHealthCheck() {
        console.log('Checking if the microservice is running...');

        const response = await axios.get(`${API_BASE}/health`);

        console.log(`Status: ${response.status}`);
        console.log('Response:');
        prettyPrint(response);
    }

    async testGetDestinations() {
        console.log('Fetching available destinations...');

        const response = await axios.get(`${API_BASE}/destinations`);

        console.log(`Status: ${response.status}`);
        console.log(`Found ${response.data.total} destinations`);
        console.log('Response (showing first 2 destinations):');

        // Limit data for video timing
        const limitedResponse = {
            ...response.data,
            destinations: response.data.destinations.slice(0, 2)
        };
        prettyPrint(limitedResponse);
    }

    async testSuccessfulRecommendation() {
        console.log('Testing successful recommendation request...');

        const requestData = {
            userId: "demo_user",
            pastVacations: [
                "Rome, Italy",
                "Kyoto, Japan",
                "Bangkok, Thailand"
            ],
            filters: {
                climate: "warm",
                budget: "medium",
                region: "Asia, Africa"
            }
        };

        console.log('Sending request:');
        prettyPrint(requestData);

        await delay(1); // Pause for video

        const response = await axios.post(`${API_BASE}/recommendations`, requestData);

        console.log(`Status: ${response.status}`);
        console.log(`Found ${response.data.totalRecommendations} recommendations`);
        console.log(`Response time: ${response.data.responseTimeMs}ms`);
        console.log('Response:');
        prettyPrint(response);
    }

    async testInvalidRequest() {
        console.log('Testing invalid request (missing userId)...');

        const invalidRequest = {
            pastVacations: ["Paris, France"],
            filters: { climate: "temperate" }
        };

        console.log('Sending invalid request:');
        prettyPrint(invalidRequest);

        try {
            await axios.post(`${API_BASE}/recommendations`, invalidRequest);
            console.log('Expected this to fail, but it succeeded!');
        } catch (error) {
            console.log(`Correctly rejected with status: ${error.response.status}`);
            console.log('Error response:');
            prettyPrint(error.response);
        }
    }

    async testNoMatches() {
        console.log('Testing request with no matching destinations...');

        const noMatchRequest = {
            userId: "no_match_user",
            pastVacations: ["New York, USA"],
            filters: {
                climate: "cold",
                budget: "low",
                region: "Antarctica"
            }
        };

        console.log('Sending request that should find no matches:');
        prettyPrint(noMatchRequest);

        try {
            await axios.post(`${API_BASE}/recommendations`, noMatchRequest);
            console.log('Expected no matches, but found some!');
        } catch (error) {
            console.log(`No matches found (status: ${error.response.status})`);
            console.log('Helpful suggestions provided:');
            prettyPrint(error.response);
        }
    }

    async testPerformance() {
        console.log('Testing performance with multiple requests...');

        const testRequest = {
            userId: "performance_user",
            pastVacations: ["Madrid, Spain"],
            filters: {
                climate: "temperate",
                budget: "medium",
                region: "Europe"
            }
        };

        const times = [];
        const requestCount = 3;

        for (let i = 1; i <= requestCount; i++) {
            console.log(`Request ${i}/${requestCount}...`);

            const startTime = Date.now();
            const response = await axios.post(`${API_BASE}/recommendations`, testRequest);
            const endTime = Date.now();

            const requestTime = endTime - startTime;
            times.push(requestTime);

            console.log(`   ${requestTime}ms (Service: ${response.data.responseTimeMs}ms)`);

            if (i < requestCount) await delay(0.5); // Delay between requests
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        console.log(`Performance Summary:`);
        console.log(`   Average: ${avgTime.toFixed(2)}ms`);
        console.log(`   Min: ${Math.min(...times)}ms, Max: ${Math.max(...times)}ms`);
    }

    async runManualMode() {
        const tests = [
            { name: 'Health Check', fn: () => this.testHealthCheck() },
            { name: 'Get Destinations', fn: () => this.testGetDestinations() },
            { name: 'Successful Recommendation', fn: () => this.testSuccessfulRecommendation() },
            { name: 'Invalid Request', fn: () => this.testInvalidRequest() },
            { name: 'No Matches Found', fn: () => this.testNoMatches() },
            { name: 'Performance Test', fn: () => this.testPerformance() }
        ];

        while (true) {
            console.log('\n' + '='.repeat(50));
            console.log('Available Tests:');
            tests.forEach((test, index) => {
                console.log(`${index + 1}. ${test.name}`);
            });
            console.log('0. Exit');
            console.log('='.repeat(50));

            const choice = await new Promise(resolve => {
                rl.question('Select test to run (0-6): ', resolve);
            });

            const testIndex = parseInt(choice) - 1;

            if (choice === '0') {
                break;
            } else if (testIndex >= 0 && testIndex < tests.length) {
                await this.runTest(tests[testIndex].name, tests[testIndex].fn);
            } else {
                console.log('Invalid choice. Please try again.');
            }
        }
    }

    async runAllTests() {
        await this.runTest('Health Check', () => this.testHealthCheck());
        await this.runTest('Browse Destinations', () => this.testGetDestinations());
        await this.runTest('Successful Recommendation', () => this.testSuccessfulRecommendation());
        await this.runTest('Invalid Request Handling', () => this.testInvalidRequest());
        await this.runTest('No Matches Scenario', () => this.testNoMatches());
        await this.runTest('Performance Testing', () => this.testPerformance());
    }

    async start() {
        await this.showWelcome();
        await this.selectMode();

        console.clear();
        console.log(`Starting demonstration in ${this.mode} mode...`);
        await delay(2);

        if (this.mode === 'manual') {
            await this.runManualMode();
        } else {
            await this.runAllTests();
        }

        console.log('\n' + '='.repeat(60));
        console.log('DEMONSTRATION COMPLETE!');
        console.log('Thank you for watching the Vacation Recommendation Microservice demo.');
        console.log('='.repeat(60));

        rl.close();
    }
}

// Main execution
async function main() {
    try {
        const demo = new InteractiveTestDemo();
        await demo.start();
    } catch (error) {
        console.log('Demo failed: ' + error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('Make sure the microservice is running on http://localhost:3000');
            console.log('   Run: npm start');
        }
        rl.close();
    }
}

if (require.main === module) {
    main();
}