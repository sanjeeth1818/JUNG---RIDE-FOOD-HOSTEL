/**
 * Geo Calculation Utilities
 * 
 * Functions for:
 * - Calculating distance between coordinates (Haversine formula)
 * - Computing dynamic request radius based on conditions
 */

/**
 * Convert degrees to radians
 */
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in kilometers

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate dynamic request radius based on various factors
 * @param {number} hour - Current hour (0-23)
 * @param {number} availableRiders - Number of available riders nearby
 * @param {boolean} isUrban - Whether location is in urban area
 * @returns {number} Recommended radius in kilometers
 */
function calculateDynamicRadius(hour, availableRiders = 10, isUrban = true) {
    let baseRadius = 3; // Default 3km

    // Peak hours adjustment (7-9 AM, 5-8 PM)
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
    if (isPeakHour) {
        baseRadius = 5; // Extend to 5km during peak hours
    }

    // Low rider availability
    if (availableRiders < 5) {
        baseRadius += 2; // Add 2km if few riders available
    } else if (availableRiders < 10) {
        baseRadius += 1; // Add 1km if moderate riders
    }

    // Urban vs outstation
    if (!isUrban) {
        baseRadius += 3; // Larger radius for outstation areas
    }

    // Cap the maximum radius at 10km
    return Math.min(baseRadius, 10);
}

/**
 * Check if location is in urban area (simplified - checks if near major cities)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if urban
 */
function isUrbanArea(lat, lng) {
    // Major cities in Sri Lanka with approximate coordinates
    const majorCities = [
        { name: 'Colombo', lat: 6.9271, lng: 79.8612, radius: 15 },
        { name: 'Kandy', lat: 7.2906, lng: 80.6337, radius: 10 },
        { name: 'Galle', lat: 6.0535, lng: 80.2210, radius: 8 },
        { name: 'Jaffna', lat: 9.6615, lng: 80.0255, radius: 8 },
        { name: 'Negombo', lat: 7.2008, lng: 79.8736, radius: 5 }
    ];

    for (const city of majorCities) {
        const distance = calculateDistance(lat, lng, city.lat, city.lng);
        if (distance <= city.radius) {
            return true;
        }
    }

    return false;
}

module.exports = {
    calculateDistance,
    calculateDynamicRadius,
    isUrbanArea,
    toRad
};
