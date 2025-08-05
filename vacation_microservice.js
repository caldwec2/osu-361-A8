const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Destination database
const DESTINATIONS = [
    {
        id: 1,
        name: "Seychelles, Africa",
        image: "https://images.example.com/seychelles.jpg",
        description: "Pristine tropical beaches with crystal-clear waters and luxury resorts, perfect for relaxation and water activities.",
        tags: ["warm", "medium", "high", "Africa", "beaches", "tropical", "luxury"],
        climate: "warm",
        budget: "high",
        region: "Africa",
        estimatedBudget: "$2500-3500",
        bestTimeToVisit: "April-October",
        activities: ["beaches", "snorkeling", "diving", "luxury resorts"]
    },
    {
        id: 2,
        name: "Chiang Mai, Thailand",
        image: "https://images.example.com/chiangmai.jpg",
        description: "Cultural hub with ancient temples, vibrant markets, and rich history, offering affordable luxury and authentic experiences.",
        tags: ["warm", "low", "medium", "Asia", "cultural", "temples", "food"],
        climate: "warm",
        budget: "low",
        region: "Asia",
        estimatedBudget: "$1200-2000",
        bestTimeToVisit: "November-February",
        activities: ["temples", "markets", "cooking classes", "cultural tours"]
    },
    {
        id: 3,
        name: "Prague, Czech Republic",
        image: "https://images.example.com/prague.jpg",
        description: "Medieval charm with stunning architecture, rich history, and affordable prices in the heart of Europe.",
        tags: ["temperate", "low", "medium", "Europe", "historical", "architecture", "beer"],
        climate: "temperate",
        budget: "medium",
        region: "Europe",
        estimatedBudget: "$1500-2500",
        bestTimeToVisit: "April-October",
        activities: ["architecture", "museums", "beer tours", "river cruises"]
    },
    {
        id: 4,
        name: "Iceland",
        image: "https://images.example.com/iceland.jpg",
        description: "Dramatic landscapes with glaciers, geysers, and northern lights, offering unique natural experiences.",
        tags: ["cold", "medium", "high", "Europe", "nature", "adventure", "northern lights"],
        climate: "cold",
        budget: "high",
        region: "Europe",
        estimatedBudget: "$3000-4500",
        bestTimeToVisit: "June-September",
        activities: ["glaciers", "geysers", "northern lights", "hot springs"]
    },
    {
        id: 5,
        name: "Bali, Indonesia",
        image: "https://images.example.com/bali.jpg",
        description: "Tropical paradise with beautiful beaches, temples, and vibrant culture at affordable prices.",
        tags: ["warm", "low", "medium", "Asia", "beaches", "cultural", "temples"],
        climate: "warm",
        budget: "low",
        region: "Asia",
        estimatedBudget: "$1000-2000",
        bestTimeToVisit: "April-October",
        activities: ["beaches", "temples", "rice terraces", "yoga retreats"]
    },
    {
        id: 6,
        name: "Morocco",
        image: "https://images.example.com/morocco.jpg",
        description: "Exotic markets, desert adventures, and rich cultural heritage in North Africa.",
        tags: ["warm", "temperate", "low", "medium", "Africa", "cultural", "desert", "markets"],
        climate: "warm",
        budget: "medium",
        region: "Africa",
        estimatedBudget: "$1500-2500",
        bestTimeToVisit: "March-May, September-November",
        activities: ["markets", "desert tours", "architecture", "cuisine"]
    },
    {
        id: 7,
        name: "Norway",
        image: "https://images.example.com/norway.jpg",
        description: "Stunning fjords, northern lights, and pristine wilderness for nature lovers.",
        tags: ["cold", "high", "Europe", "nature", "fjords", "northern lights"],
        climate: "cold",
        budget: "high",
        region: "Europe",
        estimatedBudget: "$3500-5000",
        bestTimeToVisit: "June-August",
        activities: ["fjords", "northern lights", "hiking", "midnight sun"]
    },
    {
        id: 8,
        name: "Costa Rica",
        image: "https://images.example.com/costarica.jpg",
        description: "Biodiversity hotspot with rainforests, beaches, and adventure activities.",
        tags: ["warm", "medium", "Americas", "nature", "adventure", "wildlife"],
        climate: "warm",
        budget: "medium",
        region: "Americas",
        estimatedBudget: "$2000-3000",
        bestTimeToVisit: "December-April",
        activities: ["wildlife", "rainforests", "adventure sports", "beaches"]
    },
    {
        id: 9,
        name: "Japan",
        image: "https://images.example.com/japan.jpg",
        description: "Perfect blend of traditional culture and modern innovation with excellent cuisine.",
        tags: ["temperate", "medium", "high", "Asia", "cultural", "cuisine", "temples"],
        climate: "temperate",
        budget: "high",
        region: "Asia",
        estimatedBudget: "$3000-4000",
        bestTimeToVisit: "March-May, September-November",
        activities: ["temples", "cuisine", "cherry blossoms", "technology"]
    },
    {
        id: 10,
        name: "Portugal",
        image: "https://images.example.com/portugal.jpg",
        description: "Charming coastal towns, historic cities, and excellent wine at reasonable prices.",
        tags: ["temperate", "medium", "Europe", "coastal", "wine", "historical"],
        climate: "temperate",
        budget: "medium",
        region: "Europe",
        estimatedBudget: "$2000-3000",
        bestTimeToVisit: "April-October",
        activities: ["wine tours", "coastal towns", "history", "surfing"]
    }
];

// Helper Functions
function calculateMatchScore(destination, pastVacations, filters) {
    let score = 0;
    const maxScore = 100;

    // Climate match (30 points)
    const userClimate = (filters.climate || '').toLowerCase().trim();
    if (!userClimate || userClimate === 'any' || destination.climate === userClimate) {
        score += 30;
    }

    // Budget match (25 points)
    const userBudget = (filters.budget || '').toLowerCase().trim();
    if (!userBudget || userBudget === 'any' || destination.budget === userBudget) {
        score += 25;
    }

    // Region match (25 points)
    const userRegions = (filters.region || '').toLowerCase().split(',').map(r => r.trim()).filter(r => r);
    if (userRegions.length === 0 || userRegions.includes('any') || userRegions.includes(destination.region.toLowerCase())) {
        score += 25;
    }

    // Past vacation match (20 points)
    let similarityBonus = 0;
    if (pastVacations && pastVacations.length > 0) {
        pastVacations.forEach(vacation => {
            const vacationLower = vacation.toLowerCase();
            destination.tags.forEach(tag => {
                if (vacationLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(vacationLower.split(',')[0])) {
                    similarityBonus += 3;
                }
            });
        });
    }
    score += Math.min(similarityBonus, 20);

    return Math.min(score, maxScore);
}

function analyzeTravelPatterns(pastVacations) {
    if (!pastVacations || pastVacations.length < 2) {
        return "Establishing travel preferences";
    }

    const patterns = {
        asia: 0,
        europe: 0,
        africa: 0,
        americas: 0,
        cultural: 0,
        beaches: 0,
        nature: 0
    };

    pastVacations.forEach(vacation => {
        const vacationLower = vacation.toLowerCase();

        // Regional patterns
        if (['japan', 'thailand', 'china', 'korea', 'vietnam', 'asia', 'bali', 'indonesia'].some(country => vacationLower.includes(country))) {
            patterns.asia++;
        }
        if (['italy', 'france', 'spain', 'germany', 'uk', 'europe', 'prague', 'portugal'].some(country => vacationLower.includes(country))) {
            patterns.europe++;
        }
        if (['africa', 'morocco', 'egypt', 'kenya', 'tanzania'].some(country => vacationLower.includes(country))) {
            patterns.africa++;
        }
        if (['usa', 'canada', 'mexico', 'brazil', 'america'].some(country => vacationLower.includes(country))) {
            patterns.americas++;
        }

        // Activity patterns
        if (['temple', 'museum', 'culture', 'history', 'art'].some(activity => vacationLower.includes(activity))) {
            patterns.cultural++;
        }
        if (['beach', 'island', 'tropical', 'coast'].some(activity => vacationLower.includes(activity))) {
            patterns.beaches++;
        }
        if (['mountain', 'nature', 'hiking', 'wildlife'].some(activity => vacationLower.includes(activity))) {
            patterns.nature++;
        }
    });

    // Determines primary pattern
    if (patterns.asia >= 2) return "Asian cultural and adventure destinations";
    if (patterns.europe >= 2) return "European historical and cultural destinations";
    if (patterns.cultural >= 2) return "Cultural and historical destinations";
    if (patterns.beaches >= 2) return "Tropical and beach destinations";
    if (patterns.nature >= 2) return "Nature and adventure destinations";

    return "Diverse international travel experiences";
}

function isAlreadyVisited(destination, pastVacations) {
    if (!pastVacations || pastVacations.length === 0) return false;

    return pastVacations.some(vacation => {
        const vacationLower = vacation.toLowerCase();
        const destNameLower = destination.name.toLowerCase();

        // Checks if destination name is in vacation or vice versa
        return destNameLower.includes(vacationLower.split(',')[0]) ||
               vacationLower.includes(destNameLower.split(',')[0]);
    });
}

// REST API Endpoints

// GET /api/health - Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: "healthy",
        service: "vacation-recommendation-microservice",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// GET /api/destinations - Gets all available destinations
app.get('/api/destinations', (req, res) => {
    const { region, budget, climate } = req.query;
    let filteredDestinations = [...DESTINATIONS];

    if (region && region.toLowerCase() !== 'any') {
        filteredDestinations = filteredDestinations.filter(dest =>
            dest.region.toLowerCase() === region.toLowerCase()
        );
    }

    if (budget && budget.toLowerCase() !== 'any') {
        filteredDestinations = filteredDestinations.filter(dest =>
            dest.budget.toLowerCase() === budget.toLowerCase()
        );
    }

    if (climate && climate.toLowerCase() !== 'any') {
        filteredDestinations = filteredDestinations.filter(dest =>
            dest.climate.toLowerCase() === climate.toLowerCase()
        );
    }

    res.status(200).json({
        status: "success",
        total: filteredDestinations.length,
        destinations: filteredDestinations
    });
});

// POST /api/recommendations - Main recommendation endpoint
app.post('/api/recommendations', (req, res) => {
    const startTime = Date.now();

    try {
        const { userId, pastVacations, filters } = req.body;

        // Input validation
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                status: "error",
                message: "Invalid input format",
                details: "userId is required and must be a string",
                userId: userId || null,
                timestamp: new Date().toISOString()
            });
        }

        if (!Array.isArray(pastVacations) || pastVacations.length === 0) {
            return res.status(400).json({
                status: "error", 
                message: "Invalid input format",
                details: "pastVacations must be a non-empty array",
                userId: userId,
                timestamp: new Date().toISOString()
            });
        }

        if (!filters || typeof filters !== 'object') {
            return res.status(400).json({
                status: "error",
                message: "Invalid input format",
                details: "filters must be an object",
                userId: userId,
                timestamp: new Date().toISOString()
            });
        }

        // Process recommendations
        const candidateRecommendations = [];

        DESTINATIONS.forEach(destination => {
            // Skip if visited
            if (!isAlreadyVisited(destination, pastVacations)) {
                const matchScore = calculateMatchScore(destination, pastVacations, filters);

                if (matchScore >= 60) { // Min 60% match
                    const recommendation = {
                        ...destination,
                        matchScore: `${matchScore}%`,
                        matchScoreNumeric: matchScore
                    };

                    // Similar destinations from past vacations
                    const similarDestinations = pastVacations.filter(vacation =>
                        destination.tags.some(tag =>
                            vacation.toLowerCase().includes(tag.toLowerCase())
                        )
                    );

                    recommendation.similarTo = similarDestinations.length > 0
                        ? similarDestinations.slice(0, 2)
                        : ["Based on your travel preferences"];

                    candidateRecommendations.push(recommendation);
                }
            }
        });

        // Sort by match score, take top 10
        candidateRecommendations.sort((a, b) => b.matchScoreNumeric - a.matchScoreNumeric);
        const topRecommendations = candidateRecommendations.slice(0, 10);

        // Removes internal matchScoreNumeric from response
        topRecommendations.forEach(rec => delete rec.matchScoreNumeric);

        // No matches found
        if (topRecommendations.length === 0) {
            const suggestions = [];

            if (filters.region && !['any', ''].includes(filters.region.toLowerCase())) {
                suggestions.push("Consider expanding your region preferences to include more areas");
            }
            if (filters.budget && filters.budget.toLowerCase() === 'low') {
                suggestions.push("Try 'medium' or 'high' budget range for more luxury options");
            }
            if (filters.climate && !['any', ''].includes(filters.climate.toLowerCase())) {
                suggestions.push("Consider 'temperate' climate for more variety");
            }
            if (suggestions.length === 0) {
                suggestions.push("Try different filter combinations or expand your criteria");
            }

            return res.status(404).json({
                status: "error",
                message: "No destinations found matching your criteria. Try expanding your region preferences or adjusting your budget range.",
                suggestions: suggestions,
                userId: userId,
                timestamp: new Date().toISOString(),
                responseTimeMs: Date.now() - startTime
            });
        }

        // Analyze travel
        const travelPattern = analyzeTravelPatterns(pastVacations);

        // Success response
        const response = {
            status: "success",
            userId: userId,
            totalRecommendations: topRecommendations.length,
            recommendations: topRecommendations,
            basedOnPattern: travelPattern,
            filters: filters,
            generatedAt: new Date().toISOString(),
            responseTimeMs: Date.now() - startTime
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error processing recommendations:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
            details: error.message,
            userId: req.body?.userId || null,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        status: "error",
        message: "Internal server error",
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: "error",
        message: "Endpoint not found",
        availableEndpoints: [
            "GET /api/health",
            "GET /api/destinations",
            "POST /api/recommendations"
        ],
        timestamp: new Date().toISOString()
    });
});

// Starts server
const server = app.listen(PORT, () => {
    console.log('Vacation Recommendation Microservice Started');
    console.log('=' .repeat(50));
    console.log(`Server running on: http://localhost:${PORT}`);
    console.log('Available REST endpoints:');
    console.log(`   GET  /api/health - Health check`);
    console.log(`   GET  /api/destinations - Browse destinations`);
    console.log(`   POST /api/recommendations - Get recommendations`);
    console.log('=' .repeat(50));
    console.log('Ready to accept requests!');
});

// Graceful exit
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;