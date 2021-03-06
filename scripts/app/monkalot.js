/**
 * Module that abstracts monkalots REST interface
 */
define(["./ui"], function (ui) {
    let api = 'http://localhost:8081/';
    let spin = ui.ui.spin;

    function postURL(url, args) {
        return new Promise(function(succeed, fail){
            spin(true);
            let req = new XMLHttpRequest();
            req.open("POST", url, true);
            req.addEventListener("load", function() {
                if (req.status < 400) {
                    spin(false);
                    succeed(req.responseText);
                } else {
                    spin(false);
                    fail(req.status, req.responseText);
                }
            });
            req.addEventListener("error", function() {
                spin(false);
                fail(null, new Error("Network error"));
            });
            req.send(args);
        });
    }

    return {
          getTwitchUsername : function(auth, success, failure) {
                return postURL(api + 'getTwitchUsername', "auth=" + encodeURIComponent(auth), success, failure);
          },
          getBots : function(auth, user, success, failure) {
                return postURL(api + 'bots', "auth=" + encodeURIComponent(auth) + "&user=" + encodeURIComponent(user), success, failure);
          },
          getFiles : function(auth, user, bot, success, failure) {
                return postURL(api + 'files', "auth=" + encodeURIComponent(auth) + "&user=" + encodeURIComponent(user) + "&bot=" + encodeURIComponent(bot), success, failure);
          },
          getFile : function(auth, user, bot, file, success, failure) {
                return postURL(api + 'file', "auth=" + encodeURIComponent(auth) + "&user=" + encodeURIComponent(user) + "&bot=" + encodeURIComponent(bot) + "&file=" + encodeURIComponent(file), success, failure);
          },
          setFile : function(auth, user, bot, file, content, success, failure) {
                return postURL(api + 'setfile', "auth=" + encodeURIComponent(auth) + "&user=" + encodeURIComponent(user) + "&bot=" + encodeURIComponent(bot) + "&file=" + encodeURIComponent(file) + "&content=" + encodeURIComponent(content), success, failure);
          },
          pause : function(auth, user, bot, pause, success, failure) {
                return postURL(api + 'pause', "auth=" + encodeURIComponent(auth) + "&user=" + encodeURIComponent(user) + "&bot=" + encodeURIComponent(bot) + "&pause=" + encodeURIComponent(pause), success, failure);
          }
    };
});
