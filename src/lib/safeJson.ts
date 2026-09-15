export function safeJsonParse(str: any, fallback: any = undefined) {
    try {
        if (str === undefined || str === "undefined" || str === null || str === "null") return fallback;
        return JSON.parse(str);
    } catch (e) {
        return fallback;
    }
}
