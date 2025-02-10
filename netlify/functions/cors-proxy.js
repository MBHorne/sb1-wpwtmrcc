"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }
    try {
        const { url, method = 'GET', headers = {}, body } = JSON.parse(event.body || '{}');
        if (!url) {
            return {
                statusCode: 400,
                body: 'URL is required'
            };
        }
        const response = await (0, node_fetch_1.default)(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        const data = await response.text();
        return {
            statusCode: response.status,
            body: data,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/json'
            }
        };
    }
    catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        };
    }
};
exports.handler = handler;
