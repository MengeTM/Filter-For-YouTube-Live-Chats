/**
 * Parses XML file
 * @param url URL of xml file
 * @param loaded Function where parameter is parsed XML document
 */
function parseXML(url, loaded) {
    let xhr = new XMLHttpRequest();

    xhr.onload = () => {
        let xml = xhr.responseXML.documentElement;

        loaded(xml);
    };

    xhr.onerror = (error) => {
        console.log(`Error while loading url ${url}: \n\t${error}`);
    };

    xhr.open("GET", url);
    xhr.responseType = "document";

    xhr.send();
}