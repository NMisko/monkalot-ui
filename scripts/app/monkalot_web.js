/**
 * Main module for the monkalot web interface
 */
define(["./monkalot", "./ui"], function (monkalot, ui) {

    /**
     * Controller between monkalot REST interface and user interface.
     * @type {{username: string, currentBot: string, currentFile: string, paused: boolean, ui: ui.ui, start: start, onPause: onPause, onBotChosen: onBotChosen, onFileChosen: onFileChosen, onFileSaved: onFileSaved, saveState: saveState}}
     */
    const controller = {
        username: "",
        currentBot: "",
        currentFile: "",
        paused: false,
        ui: Object.create(ui.ui),

        /**
         * Start controller, get username and set up cached data.
         */
        start: function() {
            this.ui.setup(this);
            let this_ = this;
            monkalot.getTwitchUsername(id_token).then(function(name) {
                    this_.username = JSON.parse(name)['username'];
                    this_.ui.setUsername(this_.username);
                    monkalot.getBots(id_token, this_.username)
                        .then(function(bots) {
                            bots = JSON.parse(bots);
                            this_.ui.setBots(bots);
                            //Check session storage if bot exists
                            let bot = sessionStorage.getItem("bot");
                            if (bot !== "null" && bot) {
                                this_.currentBot = bot;
                                this_.ui.setActiveBot(bot);
                                this_.onBotChosen(bot);
                            }
                        }, handleServerError);
                }, handleServerError);
        },

        /**
         * Pause or un pause (toggle) the bot.
         */
        onPause: function() {
            let this_ = this;
            monkalot.pause(id_token, this.username, this.currentBot, this.paused.toString())
                .then(function(){
                    this_.paused = !this_.paused;
                    this_.ui.setPause(this_.paused);
                }, handleServerError);
        },

        /**
         * Choose a bot and get its files.
         * @param bot Chosen bot
         */
        onBotChosen: function(bot) {
            this.currentBot = bot;
            let this_ = this;
            monkalot.getFiles(id_token, this.username, bot)
                .then(function(files) {
                    files = JSON.parse(files);
                    this_.ui.setFiles(files);

                    //Check session storage if prior selected file exists
                    let sFile = sessionStorage.getItem("file");
                    let sBot = sessionStorage.getItem("bot");
                    if (sBot === bot && sFile !== "null" && sFile) {
                        this_.currentFile = sFile;
                        this_.ui.setActiveFile(sFile);
                        this_.onFileChosen(sFile);
                    }
                }, handleServerError);
        },

        /**
         * Choose a file and display its contents.
         * @param file Chosen file
         */
        onFileChosen: function(file) {
            let this_ = this;
            this.currentFile = file;
            monkalot.getFile(id_token, this.username, this.currentBot, file)
                .then(function(content) {
                    this_.ui.setContent(JSON.stringify(JSON.parse(content)['content']));

                    //Check if session storage already contains saved content
                    content = sessionStorage.getItem("content");
                    let sBot = sessionStorage.getItem("bot");
                    let sFile = sessionStorage.getItem("file");
                    if (sBot === this_.currentBot && sFile === file && content !== "null" && content) {
                        this_.ui.setContent(content);
                        this_.ui.setSaved(false);
                    } else {
                        this_.ui.setSaved(true);
                    }
                }, handleServerError);
        },

        /**
         * Save the content of the current file.
         * @param content Content of the current file to be saved
         */
        onFileSaved: function(content) {
            let this_ = this;
            monkalot.setFile(id_token, this.username, this.currentBot, this.currentFile, content)
                .then(function() {
                    this_.ui.setSaved(true);
                    this_.clearSaveState();
                }, handleServerError);
        },

        /**
         * Reset current file.
         */
        onReset: function() {
            this.clearSaveState();
            this.onFileChosen(this.currentFile);
        },

        /**
         * Save the current state of the controller.
         */
        saveState: function() {
            let contentElement = document.getElementById("content");
            sessionStorage.setItem("bot", this.currentBot);
            sessionStorage.setItem("file", this.currentFile);
            sessionStorage.setItem("content", contentElement.value);
        },

        /**
         * Remove the saved state of the controller.
         * To be used after a file is saved.
         */
        clearSaveState: function() {
            sessionStorage.removeItem("bot");
            sessionStorage.removeItem("file");
            sessionStorage.removeItem("content");
        }
    };

    //---------------------
    // Load id_token, set up site.
    let id_token = null;
    let url = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
    let client_id = "2x318d1ydfpxo1jpyygahnd381o5wo";

    // Check if there is an id_token, if not, redirect to twitch to get it
    let id_t = getQueryVariable("id_token");
    if (!id_t) {
        redirectToTwitch();
    } else {
        id_token = id_t;
        controller.start()
    }
    //---------------------

    /**
     * Return the content of a query variable
     * @param variable Name of the variable to return
     * @returns {*} Content of the variable or false if the query variable doesn't exist
     */
    function getQueryVariable(variable) {
        let query = window.location.search.substring(1);
        let vars = query.split("&");
        for (let i=0;i<vars.length;i++) {
            let pair = vars[i].split("=");
            if(pair[0] === variable){return pair[1];}
        }
        return(false);
    }

    /**
     * If the monkalot server returns a 403 response, this is most likely due to the id_token expiring. Reload the key.
     * For any other bad response, alert.
     * @param code Error code
     * @param text Error message
     */
    function handleServerError(code, text) {
        console.log("Request failed: " + code + " - " + text);
        if (code === 403) {
            alert("Backing up and redirecting!");
            controller.saveState();
            redirectToTwitch();
        } else {
            alert(text);
        }
    }

    /**
     * Redirect to get the current id_token.
     */
    function redirectToTwitch() {
        window.location.replace("https://api.twitch.tv/kraken/oauth2/authorize?response_type=id_token%20code&client_id=" + client_id + "&redirect_uri=" + url + "&scope=openid");
    }

    return {}
});
