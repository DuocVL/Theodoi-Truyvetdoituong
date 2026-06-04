
// A simple wrapper around the fetch API to handle API calls.

const API_BASE_URL = 'http://localhost:3000/api/v1'; // Adjust if your backend URL is different

// A helper to get the auth token from localStorage
const getAuthToken = () => {
    // The token is stored as a JSON string with quotes, so we need to parse it.
    const tokenString = localStorage.getItem('authToken');
    if (tokenString) {
        try {
            return JSON.parse(tokenString);
        } catch (e) {
            console.error("Failed to parse auth token:", e);
            return null;
        }
    }
    return null;
};


// The main function to fetch tracking data
export const fetchTrackingData = async () => {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/tracking`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // The Authorization header is typically in the format 'Bearer <token>'
            'Authorization': `Bearer ${token}`
        },
    });

    if (!response.ok) {
        // Throw an error with the response status to be handled by the calling component
        throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data; // The API returns data inside a `data` property
};
