// A simple wrapper around the fetch API to handle API calls.

const API_BASE_URL = 'http://localhost:3000/api/v1'; // Adjust if your backend URL is different

// A helper to get the auth token from localStorage
const getAuthToken = () => {
    // Token is stored under the key 'token' by AuthContext
    const tokenString = localStorage.getItem('token');
    if (tokenString) {
        try {
            // tokenString is a plain string, not JSON-wrapped
            return tokenString;
        } catch (e) {
            console.error("Failed to retrieve auth token:", e);
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

// New helper to fetch the list of subjects
export const getSubjects = async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/subjects`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Error fetching subjects: ${response.statusText}`);
    }
    const result = await response.json();
    // Expect API to return an array of subjects directly or inside a data field
    return result.data || result;
}

export const getZones = async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/zones`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Error fetching zones: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data || result;
};;
