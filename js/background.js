for (var i=0; i<defaultSettings.length; ++i)
    if (widget.preferences[defaultSettings[i][0]] === undefined)
        widget.preferences[defaultSettings[i][0]] = JSON.stringify(defaultSettings[i][1]);

if (!opera.extension.getFile)
{
    function loadInjectedCSS(event, path) {
        var req = new XMLHttpRequest();
        req.open('GET', path, false);
        req.send();

        // Error check for reading the stylesheet.
        if (!req.responseText) {
            opera.postError('EXTENSION ERROR: Can\'t read ' + path);
            return;
        }

        // Send the contents of the stylesheet to the injected script.
        event.source.postMessage({
            topic: 'LoadedInjectedCSS',
            data: {
                css: req.responseText,
                path: path
            }
        });
    }
    function onMessage(event) {
        var message = event.data;
        // Check the correct message has been received and send the stylesheet path to loadInjectedCSS().
        if (message.topic == 'LoadInjectedCSS') {
            var path = message.data;
            loadInjectedCSS(event, path);
        }
    }
    window.addEventListener('DOMContentLoaded', function() {
        opera.extension.onmessage = onMessage;
    }, false);
}
