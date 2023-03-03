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