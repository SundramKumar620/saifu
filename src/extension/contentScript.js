// Saifu Wallet - Content Script
// Injected into web pages to bridge communication between the page and background script

// Inject the inpage script
function injectScript() {
    try {
        const container = document.head || document.documentElement;
        const scriptTag = document.createElement('script');
        scriptTag.setAttribute('async', 'false');
        scriptTag.src = chrome.runtime.getURL('inpage.js');
        container.insertBefore(scriptTag, container.children[0]);
        container.removeChild(scriptTag);
    } catch (error) {
        console.error('Saifu: Provider injection failed', error);
    }
}

injectScript();

// Message passing: Inpage Script -> Content Script -> Background Script
window.addEventListener('message', (event) => {
    // We only accept messages from ourselves
    if (event.source !== window || event.data.target !== 'saifu-inpage') {
        return;
    }

    const { type, data } = event.data;

    // Check if we're in a valid extension context
    if (!chrome?.runtime?.id) {
        console.error('Saifu: Extension context not available');
        window.postMessage({
            target: 'saifu-content',
            type: type,
            data: { error: 'Extension context not available' }
        }, '*');
        return;
    }

    // Forward to background script
    chrome.runtime.sendMessage({
        type,
        params: data.params,
        origin: window.location.origin
    }, (response) => {
        // Check for errors
        if (chrome.runtime.lastError) {
            console.error('Saifu: Runtime error:', chrome.runtime.lastError);
            window.postMessage({
                target: 'saifu-content',
                type: type,
                data: { error: chrome.runtime.lastError.message }
            }, '*');
            return;
        }

        // Forward response back to inpage script
        try {
            window.postMessage({
                target: 'saifu-content',
                type: type,
                data: response
            }, '*');
        } catch (error) {
            console.error('Saifu: Failed to post message:', error);
        }
    });
});

// Listen for messages from Background Script (if any need to be pushed to page)
// Currently mostly request/response pattern initiated by page, but good to have
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target === 'saifu-inpage') {
        try {
            window.postMessage({
                target: 'saifu-content',
                ...message
            }, '*');
        } catch (error) {
            console.error('Saifu: Failed to post message:', error);
        }
    }
});
