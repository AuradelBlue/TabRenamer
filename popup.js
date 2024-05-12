document.getElementById('newTitle').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        renameCurrentTab();
    }
});

document.getElementById('renameTab').addEventListener('click', renameCurrentTab);

function renameCurrentTab() {
    var newTitle = document.getElementById('newTitle').value;
    if (newTitle) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.executeScript(tabs[0].id, {
                code: 'document.title = "' + newTitle.replace(/"/g, '\\"') + '";'
            }, function() {
                if (chrome.runtime.lastError) {
                    console.error('Script execution failed: ', chrome.runtime.lastError.message);
                }
            });
        });
    }
}
