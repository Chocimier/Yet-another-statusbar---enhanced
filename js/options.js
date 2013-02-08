var style = null;

/**
 * Updates the text of a number of elements on the page
 */
function setText(items) {
    for (var i = 0; i < items.length; i++)
        $(items[i][0]).text(items[i][1]);
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

function updatePosition() {
    var bars = document.getElementsByTagName('operastatusbar');
    var corner = ' ' + JSON.parse(widget.preferences['position']).replace('-', ' ');

    for (var i=0; i<bars.length; ++i)
        bars[i].className = bars[i].className.split(' ')[0] + corner;
}

function updateFontSize() {
    var bars = document.querySelectorAll('operastatusbar, operastatusspan, p.demo');
    var size = JSON.parse(widget.preferences['font-size'])+'px !important';

    for (var i=0; i<bars.length; ++i)
        bars[i].style.fontSize = size;
}

/** Init **/
$(function() {
    // Update the version text
    setText([
        ['#widget-name', widget.name],
        ['#widget-version', widget.version],
        ['#widget-author', widget.author],
    ]);

    style = document.createElement('style');
    document.head.appendChild(style);

    updateStyle();
    updatePosition();
    updateFontSize();

    window.addEventListener('settings', function(e) {
        if (e.detail.key === 'style')
            updateStyle();
        else if (e.detail.key === 'position')
            updatePosition();
        else if (e.detail.key === 'font-size')
            updateFontSize();
    }, false);
})

/** Debug **/
$(window).keypress(function(e) {
    if (e.target.nodeName == 'INPUT' || e.target.nodeName == 'TEXTAREA')
        return;
    if (e.keyCode == 96 || e.keyCode == 126) {
        $('#storage_list').empty().append(OptionsPage.debugStorage());
    }
    if (e.keyCode == 96)
        $('#debug').toggle();
});
