document.addEventListener('DOMContentLoaded', function () {

    let game;

    let startElement = document.querySelector(".start-button");
    let usernameElement = document.querySelector("#username");
    let modalElement = document.querySelector(".modal");

    startElement.addEventListener("click", function(){
        game = new Game().init({
            width : window.innerWidth,
            height : window.innerHeight,
            files : files,
            userName : usernameElement.value
        });
        modalElement.style.display = "none";
    });

}, false);