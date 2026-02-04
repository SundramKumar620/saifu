// Message types for communication between extension components
export const MessageTypes = {
    // Provider requests (from inpage to background)
    CONNECT: 'SAIFU_CONNECT',
    DISCONNECT: 'SAIFU_DISCONNECT',
    SIGN_TRANSACTION: 'SAIFU_SIGN_TRANSACTION',
    SIGN_ALL_TRANSACTIONS: 'SAIFU_SIGN_ALL_TRANSACTIONS',
    SIGN_MESSAGE: 'SAIFU_SIGN_MESSAGE',
    GET_ACCOUNT: 'SAIFU_GET_ACCOUNT',

    // Internal messages
    APPROVAL_RESPONSE: 'SAIFU_APPROVAL_RESPONSE',
    STATE_CHANGED: 'SAIFU_STATE_CHANGED',

    // Content script relay
    REQUEST: 'SAIFU_REQUEST',
    RESPONSE: 'SAIFU_RESPONSE',
};

// Approval types
export const ApprovalTypes = {
    CONNECT: 'connect',
    SIGN_TRANSACTION: 'signTransaction',
    SIGN_ALL_TRANSACTIONS: 'signAllTransactions',
    SIGN_MESSAGE: 'signMessage',
};
