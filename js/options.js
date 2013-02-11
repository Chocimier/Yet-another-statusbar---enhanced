var style = null;

/**
 * Updates the text of a number of elements on the page
 */
function setText(items) {
    for (var i = 0; i < items.length; i++)
        document.querySelector(items[i][0]).textContent = items[i][1];
}

function updateStyle() {
    var theme = settings.style;
    var path = '/css/statusbar.' + theme + '.css';
    if (opera.extension.getFile)
    {
        var stylesheet = opera.extension.getFile(path);
        var fr = new FileReader();

        fr.onload = function() {
            var sheet = fr.result
            sheet = sheet.replace(/html\s*>/g, '').replace(/!important/g, '');
            style.textContent = sheet;
        }
        fr.readAsText(stylesheet);
    }
    else
    {
        var onCSS = function(event) {
            var message = event.data;
            // Remove the message listener so it doesn't get called again.
            opera.extension.removeEventListener('message', onCSS, false);
            var sheet = message.data.css;
            sheet = sheet.replace(/html\s*>/g, '').replace(/!important/g, '');
            style.textContent = sheet;
        }
        // On receipt of a message from the background script, execute onCSS().
        opera.extension.addEventListener('message', onCSS, false);
        // Send the stylesheet path to the background script to get the CSS.
        opera.extension.postMessage({
            topic: 'LoadInjectedCSS',
            data: path
        });
    }
}

function updateClasses() {
    var bars = document.getElementsByTagName('operastatusbar');
    var corner = ' ' + JSON.parse(widget.preferences['position']).replace('-', ' ');
    var showHttp = JSON.parse(widget.preferences['show-http']);

    for (var i=0; i<bars.length; ++i)
        bars[i].className = bars[i].className.split(' ')[0] + corner + (showHttp ? ' withhttp' : ' withouthttp');
}

function updateFontSize() {
    var bars = document.querySelectorAll('operastatusbar, operastatusspan, p.demo');
    var size = JSON.parse(widget.preferences['font-size'])+'px !important';

    for (var i=0; i<bars.length; ++i)
        bars[i].style.fontSize = size;
}

/** Init **/
window.addEventListener('load',function() {
    // Update the version text
    setText([
        ['#widget-name', widget.name],
        ['#widget-version', widget.version],
        ['#widget-author', widget.author],
    ]);

    style = document.createElement('style');
    document.head.appendChild(style);

    updateStyle();
    updateClasses();
    updateFontSize();

    window.addEventListener('settings', function(e) {
        if (e.detail.key === 'style')
            updateStyle();
        else if (e.detail.key === 'position')
            updateClasses();
        else if (e.detail.key === 'show-http')
            updateClasses();
        else if (e.detail.key === 'font-size')
            updateFontSize();
    }, false);
})

/** Debug **/
window.addEventListener('keypress', function(e) {
    if (e.target.nodeName == 'INPUT' || e.target.nodeName == 'TEXTAREA')
        return;
    if (e.keyCode == 96 || e.keyCode == 126) // ` or ~
    {
        var storage_list = document.querySelector('#storage_list');
        storage_list.innerHTML = '';
        storage_list.appendChild(OptionsPage.debugStorage())
    }
    if (e.keyCode == 96)
    {
        var debug = document.querySelector('#debug');
        debug.style.display = (debug.style.display == 'none') ? 'block' : 'none';
    }
});
