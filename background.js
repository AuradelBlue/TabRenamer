// Object to store tab IDs and their custom titles
const customTitles = {};

// Adds the context menu item
chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: "renameTab",
        title: "Rename this Tab",
        contexts: ["page"]
    });
});

// Handles context menu and shortcut command uniformly
function promptAndSetTabTitle(tab) {
    const code = `var newTitle = prompt("Enter a new title for this tab:");
                  if (newTitle !== null) { newTitle; } else { null; }`;

    chrome.tabs.executeScript(tab.id, {code: code}, function(results) {
        if (results[0] !== null) {
            customTitles[tab.id] = results[0];
            applyTitle(tab.id, results[0]);
        }
    });
}

// Applies title and ensures it with Mutation Observer
// Applies title and ensures it with Mutation Observer
function applyTitle(tabId, title) {
    const code = `
        function setTitle() {
            if (document.title !== "${title}") {
                document.title = "${title}";
            }
        }

        setTitle(); // Set title immediately

        // Set up an observer to monitor changes to the title element
        var target = document.head || document.documentElement; // Ensure there is a target to observe
        var observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes) {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        if (mutation.addedNodes[i].nodeName === 'TITLE') {
                            setTitle(); // Reset title if a new TITLE node is added
                            break;
                        }
                    }
                }
                if (mutation.type === 'childList' && mutation.target.nodeName === 'TITLE') {
                    setTitle(); // Reset title if TITLE node's children are changed
                }
            });
        });

        observer.observe(target, { childList: true, subtree: true });

        // Ensure the observer is disconnected when the tab is unloaded to prevent memory leaks
        window.addEventListener('beforeunload', () => observer.disconnect());
    `;
    chrome.tabs.executeScript(tabId, {code: code});
}

// Listens for context menu clicks
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "renameTab") {
        promptAndSetTabTitle(tab);
    }
});

// Listens for shortcut commands
chrome.commands.onCommand.addListener(function(command) {
    if (command === "rename_tab") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            promptAndSetTabTitle(tabs[0]);
        });
    }
});

// Ensures title persistence after page loads
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && customTitles[tabId]) {
        applyTitle(tabId, customTitles[tabId]);
    }
});
