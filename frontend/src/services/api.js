const API_URL = "http://localhost:5000/api";

export async function request(path, options = {}) {
    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });
    } catch {
        throw new Error(
            "Unable to connect to the backend. Please start the server and try again.",
        );
    }

    let result;
    try {
        result = await response.json();
    } catch {
        throw new Error("The server returned an invalid response.");
    }
    if (!response.ok) throw new Error(result.message || "Request failed.");
    return result.data;
}
