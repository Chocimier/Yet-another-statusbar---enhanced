function readSetting(name, def) {
    return JSON.parse(widget.preferences[name] || JSON.stringify(def))
}

var HIDE_TIMEOUT = readSetting('hide-time', 300);// Time between mouse out and hiding the statusbar

var EXPAND_TIMEOUT = readSetting('expanding-time', 1000);// Time between mouse over and expand

var ANIM_LENGTH = readSetting('animation-time', 300);// Duration of fade in/out

var MAX_WIDTH = readSetting('expanding-length', 500);// Max width of the unexpanded statusbar

var EXPANDING = readSetting('expanding-on', true);

// Assume anything that doesn't have an <a> as a parent X levels up isn't
// part of a link. We might miss some links, but this will be much faster.
var MAX_TRAVERSE = 5;
var statusbar = null;
var style = null;
var styleQuote = null;
var protocolText = null;
var subdomainText = null;
var domainText = null;
var pathText = null;
var hideTimeoutId = null;
var expandTimeoutId = null;
var removeTimeoutId = null;
var currentTarget = null;
var operatingTarget = document.createElement('a');
var isExpanded = false;
/** Initializes the statusbar */
function init() {
    var theme = JSON.parse(widget.preferences['style']);
    var path = '/css/statusbar.' + theme + '.css';
    var pathQuote = '/css/quotes.css';
    statusbar = document.createElement('operastatusbar');
    statusbar.style.display = 'none';
    statusbar.style.opacity = '0';
    statusbar.addEventListener('mouseenter', hideMouseover, false);
    protocolText = document.createElement('operastatusspan');
    protocolText.className = 'protocol';
    domainText = document.createElement('operastatusspan');
    domainText.className = 'domain';
    subdomainText = document.createTextNode('');
    pathText = document.createTextNode('');
    statusbar.appendChild(protocolText);
    statusbar.appendChild(subdomainText);
    statusbar.appendChild(domainText);
    statusbar.appendChild(pathText);
    document.documentElement.appendChild(statusbar);
    styleQuote = document.createElement('style');
    document.head.appendChild(styleQuote);
    style = document.createElement('style');
    document.head.appendChild(style);
    document.body.addEventListener('mouseover', show, false);
    if (opera.extension.getFile)
    {
        var stylesheet = opera.extension.getFile(path);
        var fr = new FileReader();
        fr.onload = function () {
            style.textContent = fr.result;
        };
        fr.readAsText(stylesheet);
    }
    else
    {
        var onCSS = function(event) {
            var message = event.data;
            opera.extension.removeEventListener('message', onCSS, false);
            style.textContent = message.data.css;
        }
        opera.extension.addEventListener('message', onCSS, false);
        opera.extension.postMessage({
            topic: 'LoadInjectedCSS',
            data: path
        });
    }
    if (opera.extension.getFile)
    {
        var stylesheet = opera.extension.getFile(pathQuote);
        var fr = new FileReader();
        fr.onload = function () {
            styleQuote.textContent = fr.result;
        };
        fr.readAsText(stylesheet);
    }
    else
    {
        var onCSS = function(event) {
            var message = event.data;
            opera.extension.removeEventListener('message', onCSS, false);
            styleQuote.textContent = message.data.css;
        }
        opera.extension.addEventListener('message', onCSS, false);
        opera.extension.postMessage({
            topic: 'LoadInjectedCSS',
            data: pathQuote
        });
    }
}
/**
* Displays the statusbar
* @param e {MouseEvent} the mouseover event for any element
*/
function show(e) {
    var target = e.target;
    for (var t = MAX_TRAVERSE; t>0 && target && !target.title && !target.href && !target.alt && target.type!='submit'; --t)
        target = target.parentNode;
    if (t==0 || target==document)
        return;
    clearTimeout(hideTimeoutId);
    clearTimeout(expandTimeoutId);
    clearTimeout(removeTimeoutId);
    if(currentTarget !== target)
    {
        currentTarget = target;
        if (target.href)
        {
            address = true;
            operatingTarget.href = target.href;
        }
        else if (target.type=='submit')
        {
            operatingTarget.href = target.form.action;
            address = true;
        }
        else if (target.title)
            address = false;
        else if (target.alt)
            address = false;
        else
            return;
        if (address)
        {
            var url = operatingTarget.href;
            var protocol = operatingTarget.protocol.replace(':', '');
            var domain = operatingTarget.hostname;
            var subdomain = '';
            // Find the subdomain (if any)
            var domainParts = domain.split('.');
            if(domainParts.length > 2) {
                subdomain = domainParts.shift() + '.';
                domain = domainParts.join('.');
            }
            // number of characters between protocol and subdomain
            var sepLength = 1;
            while(url.charAt(protocol.length + sepLength) === '/') {
                sepLength += 1;
            }
            protocolText.textContent = protocol;
            subdomainText.textContent = subdomain;
            domainText.textContent = domain;
            pathText.textContent = decodeURIComponent(url.substr(protocol.length + sepLength + subdomain.length + domain.length).trim());
            statusbar.className = protocol;
        }
        else
        {
            protocolText.textContent = subdomainText.textContent = pathText.textContent = '';
            if (target.title)
            {
                domainText.textContent = target.title;
                statusbar.className = 'title';
            }
            else if (target.alt)
            {
                domainText.textContent = target.alt;
                statusbar.className = 'alter';
            }
        }
        statusbar.style.display = 'block';
        statusbar.style.maxWidth = isExpanded ? '100%' : Math.min(MAX_WIDTH, document.documentElement.clientWidth) + 'px';
        // If the mouse is over where the statusbar should appear, don't show the statusbar
        var box = statusbar.getBoundingClientRect();
        if(e.clientX > box.left && e.clientX < box.right && e.clientY > box.top && e.clientY < box.bottom) {
            hideMouseover();
            return;
        }
        // set the statusbar to fade in
        setTimeout(function () {
            statusbar.style.opacity = '1';
        }, 0);
    }
    // set the statusbar to expand after a moment
    if (EXPANDING)
        expandTimeoutId = setTimeout(expandBar, EXPAND_TIMEOUT);
    else
        expandBar();
    // hide the statusbar when the mouse exits the hovered element
    function onMouseOut(e) {
        hide();
        target.removeEventListener('mouseout', onMouseOut, false);
    }
    target.addEventListener('mouseout', onMouseOut, false);
}
/** Hides the statusbar by fading it out */
function hide() {
    clearTimeout(expandTimeoutId);
    clearTimeout(removeTimeoutId);
    // wait for a moment before hiding
    hideTimeoutId = setTimeout(function () {
        isExpanded = false;
        currentTarget = null;
        statusbar.style.opacity = '0';
        // fade the statusbar out
        removeTimeoutId = setTimeout(function () {
            statusbar.style.display = 'none';
        }, ANIM_LENGTH);
    }, HIDE_TIMEOUT);
}
/** Hides the statusbar immediately (for when it is moused-over) */
function hideMouseover() {
    clearTimeout(expandTimeoutId);
    clearTimeout(removeTimeoutId);
    clearTimeout(hideTimeoutId);
    isExpanded = false;
    currentTarget = null;
    statusbar.style.opacity = '0';
    statusbar.style.display = 'none';
}
/** Sets bar width to full window */
function expandBar() {
    statusbar.style.maxWidth = document.documentElement.clientWidth + 'px';
    isExpanded = true;
}
function onLoad() {
    // Frames are hard. Ignore them for now
    if(window === window.top) {
        init();
        // Kill the statusbar if the extension gets disabled
        opera.extension.addEventListener('disconnection', function () {
            document.body.removeEventListener('mouseover', show, false);
            hide();
        }, false);
    }
}
// For local files, page might be completely loaded before script runs
if(document.readyState === 'interactive' || document.readyState === 'complete') {
    onLoad();
} else {
    console.log(document.readyState);
    window.addEventListener('DOMContentLoaded', onLoad, false);
}
