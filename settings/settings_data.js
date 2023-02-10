class JSONParser {
    constructor() {

    }

    parseJSON = function (json) {
        if (json.length !== undefined) {
            for (let filter of json) {
                filter.data = this.parseJSON(filter.data);
            }

            return json;
        } else {
            switch (json["type"]) {
                case "TextElement":
                    return new TextElement(json["string"], json["is_array"]);
                case "LogicalB":
                    return new LogicalBinary(json["name"], this.parseJSON(json["a"]), this.parseJSON(json["b"]));
                case "LogicalU":
                    return new LogicalUnary(json["name"], this.parseJSON(json["a"]));
                case "StringOption":
                    return new StringOption(json["name"]);
                case "StringRegex":
                    return new StringRegex(json["name"], this.parseJSON(json["key"]), this.parseJSON(json["regexp"]), this.parseJSON(json["bool"]));
                case "LogicalA":
                    return new LogicalArray(json["name"]);
                default:
                    throw Error(`Error while evaluating, type="${json["type"]}" is not available`);
            }
        }   
    }
}

function i18n(id, options = []) {
    if (Array.isArray(id)) {
        return id.map((_id) => { return i18n(_id); });
    } else {
        return browser.i18n.getMessage(id, options);
    }
}

class TextElement {
    constructor(string, isArray = true) {
        this.string = string;

        this.isArray = isArray;

        this.element = document.createElement("input");
        this.element.type = "text";
        this.element.classList.add("input");

        if (isArray && string.push !== undefined) {
            this.element.value = string.join("; ");
        } else {
            this.element.value = string;
        }

        this.element.addEventListener("change", () => {
            this.update();
        });
    }

    setArray(isArray) {
        this.isArray = isArray;

        this.update();
    }

    // Formats a string separated by ";" into an Array and deletes empty elements
    split = function (string) {
        let stringList = string.trim().split(new RegExp("[ ]*;[ ]*"));

        stringList = stringList.filter(function (item) { return item.length > 0 });
        return stringList;
    }

    update = function () {
        let string = this.element.value;

        if (this.isArray) {
            string = this.split(string);
            this.element.value = string.join("; ");
        }

        this.string = string;
    }

    json = function () {
        return { type: "TextElement", string: this.split(this.element.value), is_array: this.isArray };
    }
}

class BaseSelect extends SelectBox {
    constructor(name, options, textList) {
        let selectOptions = [];
        for (let i = 0; i < options.length; i++) {
            selectOptions.push({ value: options[i], text: textList === undefined ? options[i] : textList[i] });
        }

        super(name, selectOptions);

        this.element.classList.add("input");
        this.element.addEventListener("change", () => {
            this.name = this.element.value;
        });

        if (!name in options) {
            throw Error(`Name="${name}" should be of ${options}"`);
        }

        this.options = options;
        this.name = name;
    }

    json = function () {

    }

    toString = function () {

    }
}

class LogicalBinary extends BaseSelect {
    constructor(name, a, b) {
        super(name, ["and", "or"], i18n(["and", "or"]));

        this.a = a;
        this.b = b;

        this.element.title = "If author AND message should match, or if message OR author should match";
    }

    json = function () {
        return { type: "LogicalB", name: this.element.value, a: this.a.json(), b: this.b.json() };
    }

    evaluate = function (data) {
        switch (this.name) {
            case "and":
                return this.a.evaluate(data) && this.a.evaluate(data);
            case "or":
                return this.b.evaluate(data) || this.b.evaluate(data);
        }
    }

    replace = function (data) {
        data = this.a.replace(data);
        data = this.b.replace(data);

        return data;
    }

    toString = function () {
        return `${a.toString()} ${this.name} ${b.toString()}`;
    }
}

class LogicalUnary extends BaseSelect {
    constructor(name, a) { 
        super(name, ["not", "none"], [i18n("not"), ""]);

        this.a = a;
    }

    json = function () {
        return { type: "LogicalU", name: this.element.value, a: this.a.json() };
    }

    evaluate = function (data) {
        switch (this.name) { 
            case "not":
                return !this.a.evaluate(data);
            case "none":
                return this.a.evaluate(data);
        }
    }

    toString = function () {
        if (this.name != "none") {
            return `${this.name} ${this.a.toString()}`;
        } else {
            return this.a.toString();
        }
    }

    replace = function (data) {
        return this.a.replace(data);
    }
}

class StringOption extends BaseSelect {
    constructor(name) {
        super(name, ["author", "message"], i18n(["author", "message"]));

        this.element.title = i18n("titleSelectAuthor");
    }

    json = function () {
        return { type: "StringOption", name: this.element.value };
    }
}

class LogicalArray extends BaseSelect {
    constructor(name) {
        super(name, ["some", "every", "none"], i18n(["some", "every", "none"]));
        this.name = name;

        this.element.title = i18n("titleSelectArray");

        this.element.addEventListener("change", () => { this.name = this.element.value; });

        this.element.namedItem("every").classList.add("expert");
        this.element.namedItem("none").classList.add("expert");
    }

    disable = function (disabled) {
        this.element.disabled = disabled;

        if (disabled) {
            this.element.value = "";
        } else {
            this.element.value = this.name;
        }
    }

    json = function () {
        return { type: "LogicalA", name: this.name };
    }

    evaluate = function (array, fun) {
        switch (this.name) {
            case "some":
                return array.some((i) => { return fun(i); });
            case "every":
                return array.every((i) => { return fun(i); });
            case "none":
                return !array.some((i) => { return fun(i); });
        }
    }

    toString = function () {
        return `${this.name}`
    }
}

class StringRegex extends BaseSelect {
    constructor(name, key, regexp, bool) {
        super(name, ["startsWith", "endsWith", "includes", "is", "regexp"], i18n(["startsWith", "endsWith", "includes", "is", "regexp"]));

        this.key = key;
        this.regexp = regexp;
        this.bool = bool;

        this.element.title = i18n("titleSelectAlgo");
        this.setElements();

        this.element.namedItem("regexp").classList.add("expert");

        this.element.addEventListener("change", () => {
            this.setElements();
        });
    }

    json = function () {
        return { type: "StringRegex", name: this.element.value, key: this.key.json(), regexp: this.regexp.json(), bool: this.bool.json() };
    }

    evaluate = function (data) { 
        let string = data[this.key.name].toLocaleLowerCase();

        switch (this.name) { 
            case "startsWith":
                return this.bool.evaluate(this.regexp.string, (key) => { return string.startsWith(key.toLocaleLowerCase()); });
            case "endsWith":
                return this.bool.evaluate(this.regexp.string, (key) => { return string.endsWith(key.toLocaleLowerCase()); });
            case "includes":
                return this.bool.evaluate(this.regexp.string, (key) => { return string.includes(key.toLocaleLowerCase()); });
            case "is":
                return this.bool.evaluate(this.regexp.string, (key) => { return string == key.toLocaleLowerCase() });
            case "regexp":
                return string.match(new RegExp(this.regexp.string)) !== null;
        }
    }

    replace = function (data) {
        let string = data[this.name.key];

        switch (this.name) {
            case "startsWith":
                this.regexp.string.forEach((key) => { string = string.replaceAll(new RegExp(`^${key}`), this.replace_str); });
                break;
            case "endsWith":
                this.regexp.string.forEach((key) => { string = string.replaceAll(new RegExp(`${key}$`), this.replace_str); });
                break;
            case "includes":
                this.regexp.string.forEach((key) => { string = string.replaceAll(new RegExp(`${key}`), this.replace_str); });
                break;
            case "is":
                this.regexp.string.forEach((key) => { string = string.replaceAll(new RegExp(`^${key}$`), this.replace_str); });
                break;
            case "regexp":
                string = string.replaceAll(new RegExp(this.regexp.string), this.replace_str);
                break;
        }

        data[this.name.key] = string;

        return data;
    }

    setElements = function () {
        this.regexp.setArray(this.element.value != "regexp");

        if (this.element.value == "regexp") {
            this.regexp.element.placeholder = i18n("placeholderRegexp");
            this.regexp.element.title = i18n("titleTextSearchRegex");
            this.bool.disable(true);
        } else {
            this.regexp.element.placeholder = i18n("placeholderStringArray");
            this.regexp.element.title = i18n("titleTextSearchStrings");
            this.bool.disable(false);
        }
    }

    toString = function () {
        return `${this.key.name} ${this.name} ${this.bool.toString()} of ${this.regexp.string}`;
    }
}