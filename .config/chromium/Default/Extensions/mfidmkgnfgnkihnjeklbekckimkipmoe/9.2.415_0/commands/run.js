collectElements(currentDocument)
    .filter(el => elementMap.has(el))
    .filter(el => elementMap.get(el).filter != 'blocking')
    .forEach(allowElement)