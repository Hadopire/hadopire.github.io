export function loadFile(filePath)
{
    let response = "";
    let req = new XMLHttpRequest();
    req.open("GET", filePath, false);
    req.send();
    if (req.status == 200)
        response = req.responseText;
    return response;
}