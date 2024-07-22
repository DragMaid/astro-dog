const wait = (delay = 0) => new Promise(resolve => setTimeout(resolve, delay));
const load_screen = document.getElementById('loading-screen');
const main_screen = document.getElementById('main-page');

load_screen.style.display = "flex";
main_screen.style.display = "none";

document.addEventListener('DOMContentLoaded', () =>
  wait(2000).then(() => {
        load_screen.classList.toggle('hidden');
        main_screen.style.display = "block";
    })
);
