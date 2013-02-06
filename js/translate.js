window.addEventListener('load',function(){
    if (!translation)
        return;
    var content;
    var translatables = document.querySelectorAll('[translate="yes"]');
    for (var i=0;i<translatables.length;++i)
    {
        content = translatables[i].innerHTML;
        if (translation.hasOwnProperty(content))
            translatables[i].innerHTML = translation[content];
    }
});
