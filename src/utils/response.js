export function sendResponse(res, status, message, data = null) {
    return res.json({
        status,
        message,
        ...(data && { data })
    });
}