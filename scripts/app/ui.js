/**
 * Module containing functions managing the user interface.
 */
define (function() {

    function selectAllContents(element) {
        let range, selection;

        // Select all text in new leaf.
        // https://stackoverflow.com/a/14816523
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
            this.defaultText = "...";
        }

        setJson(json) {
            this.json = json;
            let this_ = this;

            // If this json is an array, enable adding and removing values
            let isArray = JsonBase.isArray(json);

            for (let key in json) {

                let val = json[key];
                let sVal = JSON.stringify(val);

                // This value is a leaf if it starts and ends with " or is a digit
                let isLeaf = /^".*"$/g.test(sVal) || /^[\d|.]*$/g.test(sVal);

                let keyDiv = this.newKey(key, isArray);
                this.shadow.appendChild(keyDiv, isLeaf);

                if (isLeaf) {
                    keyDiv.appendChild(this.newLeaf(key, sVal));
                } else {
                    keyDiv.appendChild(this.newChild(key, val));
                }
            }

            // Adding and removing entries is only enabled for arrays
            if(isArray) {
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
         * @returns {Element} Return the entry
         */
        newKey(key, deletable = false) {
            let this_ = this;
            let div = document.createElement('div');
            div.style.color = "grey";
            div.style.cursor = "default";

            // Add a [-] button in front of this key
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

            let t = document.createTextNode(key + ": ");
            div.appendChild(t);
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
                // Reverse the replacements
                this_.json[key] = JSON.parse('"' + leaf.innerText.replace(/"/g, "\\\"") + '"');
            });
            leaf.addEventListener("keydown", function(event) {
                // Enter adds a new entry
                if(event.keyCode === 13 && JsonBase.isArray(this_.json)) {
                    event.preventDefault();
                    this_.addNewCustomLeaf();
                // Backspace on empty entry removes it
                } else if(event.keyCode === 8 && leaf.innerText === "" && JsonBase.isArray(this_.json)) {
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
            let keyDiv = this.newKey(this.json.length, true);
            this.shadow.insertBefore(keyDiv, this.shadow.lastChild);
            let leaf = this.newLeaf(this.json.length, this.defaultText);
            keyDiv.appendChild(leaf);
            this.json[this.json.length] = this.defaultText;
            let inputEvent = new Event("input", {bubbles:true, composed:true});
            leaf.dispatchEvent(inputEvent);
            leaf.focus();
            selectAllContents(leaf);
            return leaf;
        }

        removeEntry(key) {
            let index = this.json.indexOf(key);
            if(index === -1) {
                if (JsonBase.isInt(Number(key))) {
                    index = key;
                } else {
                    // Programmer needs to ensure the right key is passed.
                    throw new DOMException("No key with that value exists.");
                }
            }
            this.json.splice(index, 1);

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
                selectAllContents(nodes[nodes.length - 2].childNodes[2]);
            }
        }

        getJson() {
            return this.json;
        }

        /**
         * Checks whether a value is an int.
         */
        static isInt(value) {
            return !isNaN(value) &&
                parseInt(Number(value)) === value &&
                !isNaN(parseInt(value, 10));
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
            // let botName = document.getElementById("botname");
            // botName.innerHTML = bot;
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
                button.innerHTML = f;
                button.className = "navButton";
                let this_ = this;
                button.addEventListener("click", function (event) {
                    this_.setActiveFile(event.target.innerHTML);

                    let oldFile = document.getElementById("selectedNavButton");
                    if (oldFile) oldFile.removeAttribute('id');
                    event.target.id = "selectedNavButton";

                    this_.controller.onFileChosen(event.target.innerHTML);
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
            let saveButton = document.getElementById("save");
            saveButton.disabled = false;
            let this_ = this;
            saveButton.addEventListener("click", function() {
                this_.controller.onFileSaved(this_.getContent());
            });

            // Save on ctrl+s
            document.addEventListener("keydown", function(event) {
                if(event.keyCode === 83 && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    this_.controller.onFileSaved(this_.getContent());
                }
            });
            let resetButton = document.getElementById("reset");
            resetButton.addEventListener("click", function () {
                this_.controller.onReset();
            });

            let j = document.createElement('json-base');
            j.id = 'json-content';
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
            let pauseS = "Paused";
            let pauseElement = document.getElementById("pause");
            if (!isPaused) pauseS = "Pause";
            pauseElement.innerHTML = pauseS;
        },

        /**
         * Return the currently entered content.
         * @returns A string of the current content
         */
        getContent: function() {
            let content = document.getElementById('json-content');
            return JSON.stringify(content.getJson());
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
                saveButton.innerHTML = "Saved";
                saveButton.className = "green";
                saveButton.disabled = true;
            } else {
                resetButton.disabled = false;
                saveButton.innerHTML = "Save";
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
        }
    };
    return {
        ui
    };
});