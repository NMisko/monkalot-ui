/**
 * Module containing functions managing the user interface.
 */
define (function() {

    /**
     * Select all text in an element.
     * https://stackoverflow.com/a/14816523
     * @param element
     */
    function selectAllContents(element) {
        let range, selection;

        if (window.getSelection && document.createRange) {
            selection = window.getSelection();
            range = document.createRange();
            range.selectNodeContents(element);
            selection.removeAllRanges();
            selection.addRange(range);
        } else if (document.selection && document.body.createTextRange) {
            range = document.body.createTextRange();
            range.moveToElementText(element);
            range.select();
        }
    }

    /**
     * DOMElement that displays an editable json.
     */
    class JsonBase extends HTMLElement {

        constructor() {
            super();
            this.shadow = this.attachShadow({mode: 'open'});
            this.defaultValue = "value";
            this.defaultKey = "key";
        }

        setJson(json) {
            this.json = json;
            let this_ = this;

            // This is a special structure that consists of the arguments, "msg", "info" and "args_info"
            let isInfoStructure = json['msg'] && json['info'] && json['args_info'] && JsonBase.isLeaf(JSON.stringify(json['msg']));

            if(isInfoStructure) {
                let div = document.createElement('div');
                div.style.backgroundColor = "whitesmoke";
                div.style.border = "1px solid black";
                div.style.padding = "10px";


                let msgDiv = document.createElement('div');
                msgDiv.appendChild(this.newLeaf('msg', JSON.stringify(json['msg'])));
                div.appendChild(msgDiv);

                let infoDiv = document.createElement('div');

                let possArgs = "";
                if (json['args_info'].length === 0) possArgs = "Possible arguments:";
                infoDiv.textContent = json['info'] + possArgs;
                infoDiv.style.fontStyle = "italic";
                infoDiv.style.color = "E6E6E6";

                let argList = document.createElement('ul');
                argList.style.marginTop = "3px";
                argList.style.marginBottom = "0px";
                for (let arg in json['args_info']) {
                    let li = document.createElement('li');
                    li.textContent = arg + " = " + json['args_info'][arg];
                    argList.appendChild(li);
                }
                infoDiv.appendChild(argList);

                div.appendChild(infoDiv);


                this.shadow.appendChild(div);
            } else {

                // This will happen in most cases, simply continue displaying the tree structure
                for (let key in json) {

                    let val = json[key];
                    let sVal = JSON.stringify(val);

                    // This value is a leaf if it starts and ends with " or is a digit
                    let isLeaf = JsonBase.isLeaf(sVal);

                    let keyDiv = this.newKey(key, isLeaf, !JsonBase.isArray(json) && isLeaf);
                    this.shadow.appendChild(keyDiv);

                    if (isLeaf) {
                        keyDiv.appendChild(this.newLeaf(key, sVal));
                    } else {
                        keyDiv.appendChild(this.newChild(key, val));
                    }
                }

                // Plus button adds a new leaf
                let plusButton = document.createElement('button');
                plusButton.textContent = "+";
                plusButton.style.fontWeight = "bold";
                plusButton.addEventListener("click", function() {
                    this_.addNewCustomLeaf();
                });
                this.shadow.appendChild(plusButton);
            }
        }

        /**
         * Add a new key entry
         * @param key The key value (must correspond exactly to the one in the json)
         * @param deletable Whether this entry should have a [-] Button in front, which deletes it.
         * @param editable Whether the key should be editable
         * @returns {Element} Return the entry
         */
        newKey(key, deletable = false, editable = false) {
            let this_ = this;
            let div = document.createElement('div');
            div.style.color = "grey";
            div.style.cursor = "default";

            // Add a [-] button in front of this key
            // Make the key value editable
            if(deletable) {
                let minusButton = document.createElement('button');
                minusButton.textContent = "−";
                minusButton.style.fontWeight = "bold";
                minusButton.style.marginRight = "10px";


                minusButton.addEventListener("click", function() {
                    this_.removeEntry(key);
                });
                div.appendChild(minusButton);
            }

            let t = document.createElement('span');
            t.textContent = key;

            if(editable) {
                t.contentEditable = editable;
                t.addEventListener('input', function() {
                    let value = this_.json[key];
                    let count = 1;
                    let newKey = t.textContent;
                    while(this_.json[newKey]) {
                        newKey = t.textContent + count;
                        count++;
                    }
                    this_.json[newKey] = value;
                    delete this_.json[key];
                    key = newKey;

                    // Index to reset leaf
                    let index = 2;
                    if(deletable) index = 3;
                    div.childNodes[index].remove();
                    div.appendChild(this_.newLeaf(key, JSON.stringify(value)));
                });
                t.addEventListener("keydown", function(event) {
                    // Enter adds a new entry
                    if(event.keyCode === 13) {
                        event.preventDefault();
                        this_.addNewCustomLeaf();
                        // Backspace on empty entry removes it
                    } else if(event.keyCode === 8 && t.innerText === "") {
                        event.preventDefault();
                        this_.removeEntry(key);
                    }
                });
            }
            div.appendChild(t);
            let divisor = document.createTextNode(":  ");
            div.appendChild(divisor);

            return div;
        }

        /**
         * Adds a new child jsonBase
         * @param key The key (necessary to propagate input changes)
         * @param val Value which gets used to construct a new jsonBase
         * @returns {Element} The new child
         */
        newChild(key, val) {
            let this_ = this;
            let subDiv = document.createElement('div');
            subDiv.style.marginLeft = "50px";

            let subJson = document.createElement('json-base');
            subJson.setJson(val);
            subJson.addEventListener("input", function() {
                this_.json[key] = subJson.getJson();
            });

            subDiv.appendChild(subJson);
            return subDiv;
        }

        // if the key changes somewhere else, it doesn't get changed here
        /**
         * Adds a new leaf
         * @param key The key (necessary to propagate input changes)
         * @param val Value displayed
         * @returns {Element} The new leaf
         */
        newLeaf(key, val) {
            let this_ = this;
            let leaf = document.createElement('span');
            leaf.innerText = val
            // remove first and last "
                .replace(/^"|"$/g, "")
                // replace all /" with "
                .replace(/\\"/g, "\"");
            leaf.contentEditable="true";
            leaf.addEventListener("input", function() {
                let value = Number(leaf.textContent);
                if(isNaN(value)) {
                    // Reverse the replacements
                    this_.json[key] = JSON.parse('"' + leaf.textContent
                        .replace(/"/g, "\\\"")
                        + '"');
                } else {
                    this_.json[key] = JSON.parse(leaf.textContent);
                }

            });
            leaf.addEventListener("keydown", function(event) {
                // Enter adds a new entry
                if(event.keyCode === 13) {
                    event.preventDefault();
                    this_.addNewCustomLeaf();
                // Backspace on empty entry removes it
                } else if(event.keyCode === 8 && leaf.innerText === "") {
                    event.preventDefault();
                    this_.removeEntry(key);
                }
            });

            leaf.style.color = "black";
            leaf.style.cursor = "text";
            return leaf;
        }

        /**
         * Adds a new user added leaf.
         * @returns {Element} The new leaf
         */
        addNewCustomLeaf() {
            let key = null;
            if(JsonBase.isArray(this.json)) key = this.json.length;
            else {
                let count = "";
                while(this.json[this.defaultKey + count]) {
                    if (count === "") count = 1;
                    else count++;
                }
                key = this.defaultKey + count;
            }
            let keyDiv = this.newKey(key, true, true);
            this.shadow.insertBefore(keyDiv, this.shadow.lastChild);

            let leaf = this.newLeaf(key, this.defaultValue);
            keyDiv.appendChild(leaf);

            this.json[key] = this.defaultValue;
            let inputEvent = new Event("input", {bubbles:true, composed:true});

            leaf.dispatchEvent(inputEvent);
            leaf.focus();
            selectAllContents(leaf);

            return leaf;
        }

        removeEntry(key) {
            if (JsonBase.isArray(this.json)) {
                this.json.splice(key, 1);
            } else {
                delete this.json[key];
            }

            // Remove all current entries and set the json to the new one, which builds up the tree again.
            while (this.shadow.firstChild) {
                this.shadow.firstChild.remove();
            }
            this.setJson(this.json);
            let inputEvent = new Event("input", {bubbles:true, composed:true});
            this.dispatchEvent(inputEvent);

            // Select the new last entry
            let nodes = this.shadow.childNodes;
            if (nodes.length - 2 >= 0) {
                selectAllContents(nodes[nodes.length - 2].childNodes[3]);
            }
        }

        getJson() {
            return this.json;
        }

        static isLeaf(s) {
            return /^".*"$/g.test(s) || /^[\d|.]*$/g.test(s);
        }

        /**
         * Checks whether the given variable is an array.
         */
        static isArray(variable) {
            return Object.prototype.toString.call(variable) === '[object Array]'
        }
    }

    // Define the new element
    customElements.define('json-base', JsonBase);

    const ui = {
        controller: null,

        /**
         * Setup user interface.
         * @param c Controller for this interface
         */
        setup: function(c) {
            this.controller = c;
            let pauseElement = document.getElementById("pause");
            let this_ = this;
            pauseElement.addEventListener("click", function () {
                this_.controller.onPause();
            });

            // Save on ctrl+s
            document.addEventListener("keydown", function(event) {
                if(event.keyCode === 83 && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    this_.controller.onFileSaved(this_.getContent());
                }
            });
        },

        /**
         * Set displayed username.
         * @param name Username to display
         */
        setUsername: function (name) {
            document.getElementById("user").textContent = name;
        },

        /**
         * Set displayed bots.
         * @param bots Bots to display
         */
        setBots: function (bots) {
            this.clean("bots");
            let botsElement = document.getElementById("bots");
            for (b of bots) {
                let option = document.createElement("option");
                let t = document.createTextNode(b);
                option.appendChild(t);
                botsElement.appendChild(option);
            }

            let pauseElement = document.getElementById("pause");
            pauseElement.disabled = false;


            // Select a random bot at first
            let selectedBot = botsElement.options[botsElement.selectedIndex].text;
            this.setActiveBot(selectedBot);
            this.controller.onBotChosen(selectedBot);

            // When another bot gets selected
            let this_ = this;
            botsElement.addEventListener("change", function () {
                if (botsElement.selectedIndex !== -1) {
                    let selectedBot = botsElement.options[botsElement.selectedIndex].text;
                    this_.setActiveBot(selectedBot);
                    this_.controller.onBotChosen(selectedBot);
                }
            });
        },

        /**
         * Set displayed active bot.
         * @param bot Active bot to display
         */
        setActiveBot: function (bot) {
            //When a new active bot get chosen, hide active file.
            let botsElement = document.getElementById("bots");
            botsElement.value = bot;

            let saveButton = document.getElementById("save");
            saveButton.className = "";

            let contentWrap = document.getElementById('content-wrap');
            while (contentWrap.hasChildNodes()) {
                contentWrap.removeChild(contentWrap.lastChild);
            }
        },

        /**
         * Set displayed files.
         * @param files Files to display
         */
        setFiles: function (files) {
            let filesElement = document.getElementById("files");
            while (filesElement.firstChild) {
                filesElement.removeChild(filesElement.firstChild);
            }
            for (f of files) {
                let li = document.createElement("li");
                let button = document.createElement("a");
                button.textContent = f;
                button.className = "navButton";
                let this_ = this;
                button.addEventListener("click", function (event) {
                    this_.setActiveFile(event.target.textContent);

                    let oldFile = document.getElementById("selectedNavButton");
                    if (oldFile) oldFile.removeAttribute('id');
                    event.target.id = "selectedNavButton";

                    this_.controller.onFileChosen(event.target.textContent);
                });
                li.appendChild(button);
                filesElement.appendChild(li);
            }
            this.setActiveFile("nothing");
        },

        /**
         * Set active file to display.
         * @param file File to display
         */
        setActiveFile: function (file) {


        },

        /**
         * Set content of a file to display.
         * @param content Content to display
         */
        setContent: function (content) {
            let this_ = this;

            this.clean("save");
            let saveButton = document.getElementById("save");
            saveButton.disabled = false;
            saveButton.addEventListener("click", function() {
                this_.controller.onFileSaved(this_.getContent());
            });

            this.clean("reset");
            let resetButton = document.getElementById("reset");
            resetButton.addEventListener("click", function () {
                this_.controller.onReset();
            });

            let j = document.createElement('json-base');
            j.id = 'json-content';

            this.clean('content-wrap');
            let contentWrap = document.getElementById('content-wrap');
            while (contentWrap.hasChildNodes()) {
                contentWrap.removeChild(contentWrap.lastChild);
            }
            contentWrap.appendChild(j);
            contentWrap.addEventListener("input", function() {
                this_.setSaved(false);
                this_.controller.saveState();
            });
            let json = JSON.parse(content);
            j.setJson(json);
        },

        /**
         * Set pause button
         * @param isPaused Whether the pause button should display pause or unpause.
         */
        setPause: function (isPaused) {
            let pauseS = "Sleep";
            let pauseElement = document.getElementById("pause");
            if (isPaused) pauseS = "Wake up";
            pauseElement.textContent = pauseS;
        },

        /**
         * Return the currently entered content.
         * @returns string string of the current content
         */
        getContent: function() {
            let content = document.getElementById('json-content');
            if(content) return JSON.stringify(content.getJson());
            else return "";
        },

        /**
         * Set save button
         * @param isSaved Whether the save button should display save or saved.
         */
        setSaved: function(isSaved) {
            let saveButton = document.getElementById("save");
            let resetButton = document.getElementById("reset");
            if (isSaved) {
                resetButton.disabled = true;
                saveButton.textContent = "Saved";
                saveButton.className = "green";
                saveButton.disabled = true;
            } else {
                resetButton.disabled = false;
                saveButton.textContent = "Save";
                saveButton.className = "red";
                saveButton.disabled = false;
            }
        },

        /**
         * Show the loading spinner
         * @param toSpin Whether to spin or not to spin
         */
        spin: function(toSpin) {
            let spinner = document.getElementById("spinner");
            if (toSpin) spinner.style.visibility = 'visible';
            else spinner.style.visibility = 'hidden';
        },

        /**
         * Replaces an element with a copy of itself, removing all event listeners.
         * @param id ID of the element
         */
        clean: function(id) {
            let el = document.getElementById(id);
            let elClone = el.cloneNode(true);

            el.parentNode.replaceChild(elClone, el);
        }
    };
    return {
        ui
    };
});