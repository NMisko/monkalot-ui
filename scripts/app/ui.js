/**
 * Module containing functions managing the user interface.
 */
define (function() {

    /**
     * DOMElement that displays an editable json.
     */
    class JsonBase extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({mode: 'open'});
        }

        setJson(json) {
            let this_ = this;
            this.json = json;

            for (let key in json) {
                let div = document.createElement('div');
                let val = json[key];
                let t = document.createTextNode(key + ": ");
                let sVal = JSON.stringify(val);
                div.style.color = "grey";
                div.style.cursor = "default";
                this.shadow.appendChild(div);
                div.appendChild(t);

                // If value is either a string or a number (a leaf), make it editable and add it inline
                if (/^".*"$/g.test(sVal) || /^[\d|.]*$/g.test(sVal)) {
                    let leaf = document.createElement('span');
                    leaf.innerText = sVal
                        // remove first and last "
                        .replace(/^"|"$/g, "")
                        // replace all /" with "
                        .replace(/\\"/g, "\"");
                    leaf.contentEditable="true";
                    leaf.addEventListener("input", function() {
                        // Reverse the replacements
                        this_.json[key] = JSON.parse('"' + leaf.innerText.replace(/"/g, "\\\"") + '"');
                    });
                    leaf.style.color = "black";
                    leaf.style.cursor = "text";
                    leaf.className = "test";
                    div.appendChild(leaf);

                // Else recursively add another json-base 50px to the left.
                } else {
                    let subDiv = document.createElement('div');
                    subDiv.style.marginLeft = "50px";

                    let subJson = document.createElement('json-base');
                    subJson.setJson(val);
                    subJson.addEventListener("input", function() {
                        this_.json[key] = subJson.getJson();
                    });

                    subDiv.appendChild(subJson);
                    div.appendChild(subDiv);
                }
            }
        }

        getJson() {
            return this.json;
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
            saveButton.addEventListener("click", function () {
                this_.controller.onFileSaved(this_.getContent());
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