
const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
    console.warn('NEXT_PUBLIC_API_URL is not defined');
}

type APIResponse<T> = {
    status?: 'success' | 'error';
    error?: string;
    data?: T;
    user?: T;
    rawData?: any[][];
    sheets?: string[];
};

export async function fetchGAS<T>(
    action: string,
    params: Record<string, string> = {},
    method: 'GET' | 'POST' = 'GET',
    body?: any
): Promise<APIResponse<T>> {
    if (!API_URL) {
        throw new Error("API URL not configured");
    }

    const url = new URL(API_URL);
    url.searchParams.append('action', action);

    // Append GET params
    if (method === 'GET') {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
    }

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'text/plain;charset=utf-8', // GAS requires text/plain for POST to work well usually, or standard JSON
        },
    };

    if (method === 'POST' && body) {
        // GAS often receives POST data as stringified JSON in 'postData.contents'
        // We send it as a JSON string with action included in body for convenience
        options.body = JSON.stringify({ action, ...body });
    }

    try {
        console.log(`GAS Request [${method}]:`, url.toString());
        if (method === 'POST') console.log("GAS Body:", options.body);

        const res = await fetch(url.toString(), options);
        if (!res.ok) {
            throw new Error(`API Error: ${res.statusText}`);
        }
        const data = await res.json();

        if (data.error) {
            console.error("GAS API Error [Data]:", data.error);
            throw new Error(data.error);
        }

        return data;
    } catch (error: any) {
        console.error(`GAS API Execution Error [${action}]:`, error);
        throw error;
    }
}
