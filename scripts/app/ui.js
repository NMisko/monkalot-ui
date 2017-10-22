/**
 * Module containing functions managing the user interface.
 */
define (function() {
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
            let contentElement = document.getElementById("content");
            contentElement.value = "";
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
            let contentElement = document.getElementById("content");
            contentElement.value = content;
            let saveButton = document.getElementById("save");
            saveButton.disabled = false;
            let this_ = this;
            contentElement.addEventListener('input', function () {
                this_.setSaved(false);
                this_.controller.saveState();
            });
            saveButton.addEventListener("click", function () {
                this_.controller.onFileSaved(contentElement.value);
            });
            let resetButton = document.getElementById("reset");
            resetButton.addEventListener("click", function () {
                this_.controller.onReset();
            });
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