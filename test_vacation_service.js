const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test data
const TEST_CASES = {
    validRequest: {
        userId: "abh431",
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
    },
    invalidUserId: {
        pastVacations: ["Paris, France"],
        filters: { climate: "temperate" }
    },
    invalidPastVacations: {
        userId: "test123",
        pastVacations: [],
        filters: { climate: "warm" }
    },
    noMatches: {
        userId: "test123",
        pastVacations: ["New York, USA"],
        filters: {
            climate: "cold",
            budget: "low",
            region: "Antarctica"
        }
    },
    minimalFilters: {
        userId: "test456",
        pastVacations: ["London, UK"],
        filters: {}
    }
};

class VacationMicroserviceTest {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.totalTests = 0;
    }

    async runAllTests() {
        console.log('VACATION RECOMMENDATION MICROSERVICE REST API TEST');
        console.log('=' .repeat(65));
        console.log(`Testing API at: ${API_BASE}`);
        console.log('=' .repeat(65));

        try {
            // Test 1: Health Check
            await this.testHealthCheck();

            // Test 2: Get Destinations
            await this.testGetDestinations();

            // Test 3: Valid Recommendation Request
            await this.testValidRecommendations();

            // Test 4: Invalid User ID
            await this.testInvalidUserId();

            // Test 5: Invalid Past Vacations
            await this.testInvalidPastVacations();

            // Test 6: No Matches Found
            await this.testNoMatches();

            // Test 7: Minimal Filters
            await this.testMinimalFilters();

            // Test 8: Performance Test
            await this.testPerformance();

        } catch (error) {
            console.log('FATAL ERROR: Could not connect to microservice');
            console.log(`   Make sure the server is running on ${BASE_URL}`);
            console.log(`   Error: ${error.message}`);
            return;
        }

        this.printSummary();
    }

    async testHealthCheck() {
        await this.runTest('Health Check Endpoint', async () => {
            const response = await axios.get(`${API_BASE}/health`);

            this.assertEqual(response.status, 200, 'Status should be 200');
            this.assertEqual(response.data.status, 'healthy', 'Service should be healthy');
            this.assertExists(response.data.timestamp, 'Should include timestamp');

            console.log(`   Service: ${response.data.service}`);
            console.log(`   Version: ${response.data.version}`);
            console.log(`   Uptime: ${Math.round(response.data.uptime)}s`);
        });
    }

    async testGetDestinations() {
        await this.runTest('Get Destinations Endpoint', async () => {
            const response = await axios.get(`${API_BASE}/destinations`);

            this.assertEqual(response.status, 200, 'Status should be 200');
            this.assertEqual(response.data.status, 'success', 'Should be successful');
            this.assertGreaterThan(response.data.total, 0, 'Should have destinations');
            this.assertExists(response.data.destinations, 'Should include destinations array');

            console.log(`   Found ${response.data.total} available destinations`);

            // Test with filters
            const filteredResponse = await axios.get(`${API_BASE}/destinations?region=Asia&budget=low`);
            this.assertEqual(filteredResponse.status, 200, 'Filtered request should work');
            console.log(`   Asia + Low budget filter: ${filteredResponse.data.total} destinations`);
        });
    }

    async testValidRecommendations() {
        await this.runTest('Valid Recommendation Request', async () => {
            const startTime = Date.now();
            const response = await axios.post(`${API_BASE}/recommendations`, TEST_CASES.validRequest);
            const requestTime = Date.now() - startTime;

            this.assertEqual(response.status, 200, 'Status should be 200');
            this.assertEqual(response.data.status, 'success', 'Should be successful');
            this.assertEqual(response.data.userId, TEST_CASES.validRequest.userId, 'Should return correct userId');
            this.assertGreaterThan(response.data.totalRecommendations, 0, 'Should have recommendations');
            this.assertExists(response.data.recommendations, 'Should include recommendations array');
            this.assertExists(response.data.basedOnPattern, 'Should include travel pattern analysis');
            this.assertLessThan(response.data.responseTimeMs, 500, 'Response time should be under 500ms');

            console.log(`   Received ${response.data.totalRecommendations} recommendations`);
            console.log(`   Response time: ${response.data.responseTimeMs}ms (Request: ${requestTime}ms)`);
            console.log(`   Travel pattern: ${response.data.basedOnPattern}`);

            // Validate recommendation structure
            const firstRec = response.data.recommendations[0];
            this.assertExists(firstRec.name, 'Recommendation should have name');
            this.assertExists(firstRec.matchScore, 'Recommendation should have match score');
            this.assertExists(firstRec.description, 'Recommendation should have description');
            this.assertExists(firstRec.estimatedBudget, 'Recommendation should have budget info');

            console.log(`   Top recommendation: ${firstRec.name} (${firstRec.matchScore} match)`);
        });
    }

    async testInvalidUserId() {
        await this.runTest('Invalid User ID Request', async () => {
            try {
                await axios.post(`${API_BASE}/recommendations`, TEST_CASES.invalidUserId);
                this.fail('Should have thrown an error for missing userId');
            } catch (error) {
                this.assertEqual(error.response.status, 400, 'Should return 400 Bad Request');
                this.assertEqual(error.response.data.status, 'error', 'Should be error status');
                this.assertContains(error.response.data.message, 'Invalid input format', 'Should mention invalid input');
                this.assertContains(error.response.data.details, 'userId', 'Should mention userId issue');

                console.log(`   Correctly rejected with: ${error.response.data.details}`);
            }
        });
    }

    async testInvalidPastVacations() {
        await this.runTest('Invalid Past Vacations Request', async () => {
            try {
                await axios.post(`${API_BASE}/recommendations`, TEST_CASES.invalidPastVacations);
                this.fail('Should have thrown an error for empty pastVacations');
            } catch (error) {
                this.assertEqual(error.response.status, 400, 'Should return 400 Bad Request');
                this.assertContains(error.response.data.details, 'pastVacations', 'Should mention pastVacations issue');

                console.log(`   Correctly rejected with: ${error.response.data.details}`);
            }
        });
    }

    async testNoMatches() {
        await this.runTest('No Matches Found Request', async () => {
            try {
                await axios.post(`${API_BASE}/recommendations`, TEST_CASES.noMatches);
                this.fail('Should have thrown an error for no matches');
            } catch (error) {
                this.assertEqual(error.response.status, 404, 'Should return 404 Not Found');
                this.assertEqual(error.response.data.status, 'error', 'Should be error status');
                this.assertExists(error.response.data.suggestions, 'Should provide suggestions');

                console.log(`   No matches found with ${error.response.data.suggestions.length} suggestions`);
                error.response.data.suggestions.forEach((suggestion, i) => {
                    console.log(`      ${i + 1}. ${suggestion}`);
                });
            }
        });
    }

    async testMinimalFilters() {
        await this.runTest('Minimal Filters Request', async () => {
            const response = await axios.post(`${API_BASE}/recommendations`, TEST_CASES.minimalFilters);

            this.assertEqual(response.status, 200, 'Should work with minimal filters');
            this.assertGreaterThan(response.data.totalRecommendations, 0, 'Should still get recommendations');

            console.log(`   Works with empty filters: ${response.data.totalRecommendations} recommendations`);
        });
    }

    async testPerformance() {
        await this.runTest('Performance Test', async () => {
            const iterations = 5;
            const times = [];

            console.log(`   Running ${iterations} requests to test performance...`);

            for (let i = 0; i < iterations; i++) {
                const startTime = Date.now();
                const response = await axios.post(`${API_BASE}/recommendations`, TEST_CASES.validRequest);
                const requestTime = Date.now() - startTime;
                times.push(requestTime);

                this.assertLessThan(requestTime, 1000, `Request ${i + 1} should be under 1000ms`);
            }

            const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);
            const minTime = Math.min(...times);

            console.log(`   Average response time: ${averageTime.toFixed(2)}ms`);
            console.log(`   Min: ${minTime}ms, Max: ${maxTime}ms`);

            this.assertLessThan(averageTime, 500, 'Average response time should be under 500ms');
        });
    }

    async runTest(testName, testFunction) {
        this.totalTests++;
        console.log(`\nTest ${this.totalTests}: ${testName}`);

        try {
            await testFunction();
            this.passedTests++;
            this.testResults.push({ name: testName, status: 'PASSED' });
            console.log(`   PASSED`);
        } catch (error) {
            this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
            console.log(`   FAILED: ${error.message}`);
        }
    }

    // Assertion helpers
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
        }
    }

    assertExists(value, message) {
        if (value === undefined || value === null) {
            throw new Error(`${message} - Value should exist`);
        }
    }

    assertGreaterThan(actual, expected, message) {
        if (actual <= expected) {
            throw new Error(`${message} - Expected > ${expected}, Actual: ${actual}`);
        }
    }

    assertLessThan(actual, expected, message) {
        if (actual >= expected) {
            throw new Error(`${message} - Expected < ${expected}, Actual: ${actual}`);
        }
    }

    assertContains(text, substring, message) {
        if (!text.toString().toLowerCase().includes(substring.toLowerCase())) {
            throw new Error(`${message} - Text should contain "${substring}"`);
        }
    }

    fail(message) {
        throw new Error(message);
    }

    printSummary() {
        console.log('\n' + '=' .repeat(65));
        console.log('TEST SUMMARY');
        console.log('=' .repeat(65));
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`Passed: ${this.passedTests}`);
        console.log(`Failed: ${this.totalTests - this.passedTests}`);
        console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);

        console.log('\nDetailed Results:');
        this.testResults.forEach((result, i) => {
            const status = result.status === 'PASSED' ? 'PASS' : 'FAIL';
            console.log(`   ${i + 1}. ${status} ${result.name}`);
            if (result.error) {
                console.log(`      Error: ${result.error}`);
            }
        });

        if (this.passedTests === this.totalTests) {
            console.log('\nALL TESTS PASSED! The microservice is working correctly.');
        } else {
            console.log('\nSome tests failed. Check the error messages above.');
        }

        console.log('=' .repeat(65));
    }
}

// Helper function for manual testing
async function quickTest() {
    console.log('Quick Manual Test');
    console.log('-' .repeat(30));

    try {
        // Health check
        const healthResponse = await axios.get(`${API_BASE}/health`);
        console.log(`Health Check: ${healthResponse.data.status}`);

        // Simple recommendation request
        const recResponse = await axios.post(`${API_BASE}/recommendations`, {
            userId: "quicktest",
            pastVacations: ["Tokyo, Japan"],
            filters: { climate: "warm", budget: "medium" }
        });

        console.log(`Recommendations: ${recResponse.data.totalRecommendations} found`);
        console.log(`Response time: ${recResponse.data.responseTimeMs}ms`);

        if (recResponse.data.recommendations.length > 0) {
            const top = recResponse.data.recommendations[0];
            console.log(`Top suggestion: ${top.name} (${top.matchScore})`);
        }

    } catch (error) {
        console.log(`Error: ${error.message}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Details: ${error.response.data.message}`);
        }
    }
}

// Main execution
async function main() {
    console.log('Vacation Recommendation Microservice REST API Tester');
    console.log('Make sure the microservice is running before starting tests...\n');

    // Check if we should run quick test or full test suite
    const args = process.argv.slice(2);

    if (args.includes('--quick') || args.includes('-q')) {
        await quickTest();
    } else {
        const tester = new VacationMicroserviceTest();
        await tester.runAllTests();
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { VacationMicroserviceTest, quickTest };