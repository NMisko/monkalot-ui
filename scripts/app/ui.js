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
                let li = document.createElement("li");
                let button = document.createElement("button");
                button.innerHTML = b;
                let this_ = this;
                button.addEventListener("click", function (event) {
                    let chosenBot = event.target.innerHTML;
                    this_.setActiveBot(chosenBot);
                    this_.controller.onBotChosen(chosenBot);
                });
                li.appendChild(button);
                botsElement.appendChild(li);
            }
        },

        /**
         * Set displayed active bot.
         * @param bot Active bot to display
         */
        setActiveBot: function (bot) {
            let botName = document.getElementById("botname");
            botName.innerHTML = bot;
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
                let button = document.createElement("button");
                button.innerHTML = f;
                let this_ = this;
                button.addEventListener("click", function (event) {
                    this_.setActiveFile(event.target.innerHTML);
                    this_.controller.onFileChosen(event.target.innerHTML);
                });
                li.appendChild(button);
                filesElement.appendChild(li);
            }
            let contentElement = document.getElementById("content");
            contentElement.value = "";
            let filename = document.getElementById("filename");
            filename.innerHTML = "nothing";
        },

        /**
         * Set active file to display.
         * @param file File to display
         */
        setActiveFile: function (file) {
            let filename = document.getElementById("filename");
            filename.innerHTML = file;
        },

        /**
         * Set content of a file to display.
         * @param content Content to display
         */
        setContent: function (content) {
            let contentElement = document.getElementById("content");
            contentElement.value = content;
            let saveButton = document.getElementById("save");
            let this_ = this;
            contentElement.addEventListener('input', function () {
                saveButton.innerHTML = "Save";
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
            if (!isPaused) pauseS = "Unpaused";
            pauseElement.innerHTML = pauseS;
        },

        /**
         * Set save button
         * @param isSaved Whether the save button should display save or saved.
         */
        setSaved: function(isSaved) {
            let saveButton = document.getElementById("save");
            if (isSaved) saveButton.innerHTML = "Saved";
            else saveButton.innerHTML = "Save";
        }
    };
    return {
        ui
    };
});