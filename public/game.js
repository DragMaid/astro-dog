function nthIndex(str, pat, n) {
    var L = str.length, i = -1;
    while (n-- && i++ < L) {
        i = str.indexOf(pat, i);
        if (i < 0)
            break;
    }
    return i;
}
const fps = 30;
const frame_duration = 1000 / fps;
var start = Date.now();
var e_bullets = [];
var p_bullets = [];
var enemies = [];
var players = [];
var laser_stack = 0;
var bark_stack = 0;
var score = 0;
var laser_isshot = false;
var bark_ready = true;
var username;
const pageURL = String(document.URL);
const mainURL = pageURL.substring(0, nthIndex(pageURL, '/', 3));
const ldbURL = mainURL + '/records';
var Game;
var barkid;
var barkcdid;
var cleanupid;
var enemies_count = 0;
function start_game() {
    bark_ready = true;
    laser_stack = 10;
    bark_stack = 10;
    Game = undefined;
    Game = new game();
    Game.init();
    update_laser_bar();
    update_bark_bar();
}
function clear_game() {
    players.forEach((entity) => { entity.destroy(); });
    enemies.forEach((entity) => { entity.destroy(); });
    p_bullets.forEach((entity) => { entity.destroy(); });
    e_bullets.forEach((entity) => { entity.destroy(); });
    Game.destroy();
    players = [];
    enemies = [];
    e_bullets = [];
    p_bullets = [];
    laser_stack = 0;
    bark_stack = 0;
    score = 0;
    update_score();
    update_bark_bar();
    update_laser_bar();
    window.clearTimeout(barkcdid);
    window.clearInterval(barkid);
    window.clearTimeout(cleanupid);
}
function bark() {
    if (bark_ready) {
        bark_ready = false;
        bark_stack = 0;
        update_bark_bar();
        var template = document.querySelector('[bark-circle]');
        var blast = template.content.cloneNode(true).children[0];
        var player = document.querySelector('[player]');
        blast.style.left = String(players[0].get_position()[0]) + 'px';
        blast.style.top = String(players[0].get_position()[1]) + 'px';
        var renderer = document.querySelector('[game-screen]');
        renderer.append(blast);
        var bark_audio = new Audio('sounds/bark.mp3');
        bark_audio.play();
        e_bullets.forEach((entity) => { entity.destroy(); });
        barkcdid = window.setTimeout(() => { bark_ready = true; }, 10000);
        barkid = window.setInterval(() => {
            bark_stack = Math.min(bark_stack + 1, 10);
            update_bark_bar();
        }, 1000);
        window.setTimeout(() => { window.clearInterval(barkid); }, 10000);
        window.setTimeout(() => { blast.parentNode.removeChild(blast); }, 1000);
    }
}
function open_lose_screen() {
    clear_game();
    document.querySelector("[lose-screen]").classList.toggle("active");
}
function close_lose_screen() {
    document.querySelector("[lose-screen]").classList.remove("active");
}
function open_menu_screen() {
    document.querySelector("[menu-screen]").classList.toggle("active");
    update_leader_board();
}
function close_menu_screen() {
    document.querySelector("[menu-screen]").classList.remove("active");
}
function restart_button_func() {
    start_game();
    close_lose_screen();
}
function play_button_func() {
    var data = document.getElementById("search").value;
    if (data.length > 0) {
        username = data;
        close_menu_screen();
        start_game();
    }
}
function menu_button_func() {
    close_lose_screen();
    open_menu_screen();
}
function set_laser_stack(count) {
    laser_stack = count;
    update_laser_bar();
}
function update_laser_bar() {
    var laser_bar = document.querySelector("[mana-bar]");
    for (let i = 9; i >= 0; i--) {
        laser_bar.children[i]["style"].backgroundColor = "";
    }
    for (let i = 9; i > 9 - laser_stack; i--) {
        laser_bar.children[i]["style"].backgroundColor = "yellow";
    }
}
function update_score() {
    document.querySelector("[score]").innerHTML = "SCORE: " + score;
}
function update_bark_bar() {
    var bark_bar = document.querySelector("[bark-bar]");
    for (let i = 9; i >= 0; i--) {
        bark_bar.children[i]["style"].backgroundColor = "";
    }
    for (let i = 9; i > 9 - bark_stack; i--) {
        bark_bar.children[i]["style"].backgroundColor = "blue";
    }
}
function update_leader_board() {
    clear_leader_board();
    fetch(ldbURL)
        .then(res => res.json())
        .then(data => {
        var items = Object.keys(data).map(function (key) { return [key, data[key]]; });
        items.sort(function (first, second) { return first[1] - second[1]; });
        for (let i = items.length - 1; i >= 0; i--) {
            add_leader_board_card(items.length - i, items[i][0], items[i][1]);
        }
    });
}
function clear_leader_board() {
    const container = document.querySelector("[result-container]");
    container.innerHTML = "";
}
function add_leader_board_card(rank, name, score) {
    const template = document.querySelector("[result-card-template]");
    const card = template.content.cloneNode(true).children[0];
    const card_rank = card.querySelector("[data-rank]");
    const card_name = card.querySelector("[data-name]");
    const card_score = card.querySelector("[data-score]");
    card_rank.textContent = String(rank);
    card_name.textContent = String(name);
    card_score.textContent = String(score);
    const container = document.querySelector("[result-container]");
    container.append(card);
}
function update_new_record(name, score) {
    var destination = mainURL + '/' + 'upload';
    var req = new XMLHttpRequest();
    var data = JSON.stringify({ 'name': name, 'score': score });
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            if (req.status == 200) { }
            else
                console.log("Problem occured while uploading record!");
        }
    };
    req.open("post", destination, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(data);
}
update_leader_board();
function save_high_score() {
}
class game {
    constructor() {
        this.renderer = document.querySelector("[game-screen]");
        this.Player = new player(this.renderer, "kato", [42, 75], [500, 500]);
        players.push(this.Player);
    }
    init() {
        this.game_loop();
        this.spawnid = window.setInterval(() => { this.enemy_spawn(); }, 1000);
    }
    destroy() {
        window.clearInterval(this.spawnid);
        this.Player = null;
    }
    enemy_spawn() {
        var capacity = 50;
        var ran = Math.floor(Math.random() * window.innerWidth);
        if (enemies_count <= capacity) {
            var Enemy = new enemy(this.renderer, enemies.length, "phi", [100, 100], [ran, 100]);
            enemies.push(Enemy);
        }
    }
    game_loop() {
        requestAnimationFrame(() => this.game_loop());
        var current = Date.now();
        var elapsed = current - start;
        if (elapsed > frame_duration) {
            this.update();
            this.render();
            start = current;
        }
    }
    update() {
        players.forEach((entity) => { entity.update(); });
        enemies.forEach((entity) => { entity.update(); });
        p_bullets.forEach((entity) => { entity.update(); });
        e_bullets.forEach((entity) => { entity.update(); });
    }
    render() {
        players.forEach((entity) => { entity.render(); });
        enemies.forEach((entity) => { entity.render(); });
        p_bullets.forEach((entity) => { entity.render(); });
        e_bullets.forEach((entity) => { entity.render(); });
    }
}
class entity {
    constructor(name, health, damage, speed, size, position) {
        this.name = name;
        this.health = health;
        this.damage = damage;
        this.speed = speed;
        this.position = position;
        this.size = size;
    }
    get_name() { return this.name; }
    get_health() { return this.health; }
    get_damage() { return this.damage; }
    get_position() { return this.position; }
    get_size() { return this.size; }
    get_speed() { return this.speed; }
    set_size(size) { this.size = size; }
    set_position(position) { this.position = position; }
    set_health(health) { this.health = health; }
    set_damage(damage) { this.damage = damage; }
    set_speed(speed) { this.speed = speed; }
}
class player extends entity {
    constructor(renderer, name, size, position) {
        var health = 3;
        var damage = 10;
        var speed = 5;
        super(name, health, damage, speed, size, position);
        this.temp = document.querySelector("[player-template]");
        this.screen = document.querySelector("[touch]");
        this.p_temp = this.temp.content.cloneNode(true).children[0];
        this.sprite = this.p_temp.querySelector("[sprite]");
        this.s_path = "assets/dog.webp";
        this.renderer = renderer;
        this.setup();
    }
    setup() {
        this.p_temp.style.left = this.get_position()[0] + "px";
        this.p_temp.style.top = this.get_position()[1] + "px";
        this.p_temp.style.width = this.get_size()[0] + "px";
        this.p_temp.style.height = this.get_size()[1] + "px";
        document.body.onpointermove = event => {
            const { clientX, clientY } = event;
            this.set_position([clientX, clientY]);
            this.p_temp.animate({
                left: `${clientX}px`,
                top: `${clientY}px`
            }, { duration: 0, fill: "forwards" });
        };
        this.p_temp.addEventListener('mousedown', (event) => {
            if (event.button === 0) {
                this.fire_laser();
            }
        });
        var game_screen = document.querySelector('[game-screen]');
        document.body.addEventListener('keydown', function (e) {
            if (e.key == ' ' || e.code == 'Space' || e.keyCode == 32) {
                bark();
            }
            ;
        });
        this.sprite.src = this.s_path;
        this.renderer.append(this.p_temp);
        this.auto_shoot();
        this.update_health_bar();
        document.querySelector('[player]').ondragstart = function () { return false; };
    }
    destroy() {
        laser_isshot = false;
        this.p_temp.parentNode.removeChild(this.p_temp);
        window.clearTimeout(this.flashid);
        window.clearInterval(this.shootid);
        window.clearTimeout(this.laserid);
    }
    get_anchor() {
        const height = this.get_size()[1];
        var pos = this.get_position();
        var anchor = [pos[0], pos[1] - height / 2];
        return anchor;
    }
    fire_laser() {
        ;
        if (laser_stack === 10 && laser_isshot === false) {
            laser_isshot = true;
            window.clearInterval(this.shootid);
            const id = p_bullets.length;
            const Laser = new laser(this.renderer, id, "player", [60, window.innerHeight + 9999], [this.get_anchor()[0], this.get_anchor()[1] - window.innerHeight / 2]);
            this.pre_laser = Laser;
            p_bullets.push(Laser);
            this.laserid = window.setTimeout(() => { this.laser_off(); }, this.pre_laser.get_laser_duration());
        }
    }
    get_laser_anchor() {
        var current_pos = this.get_anchor();
        var new_pos = [current_pos[0], current_pos[1] - this.pre_laser.get_size()[1] / 2];
        return new_pos;
    }
    laser_off() {
        set_laser_stack(0);
        this.pre_laser.destroy();
        this.auto_shoot();
    }
    bite() {
    }
    auto_shoot() {
        this.shootid = window.setInterval(() => this.shoot(), 120);
    }
    shoot() {
        const id = p_bullets.length;
        const Bullet = new bullet(this.renderer, id, "player", [20, 20], this.get_anchor());
        p_bullets.push(Bullet);
        var audio = new Audio('sounds/gun.mp3');
        audio.volume = 0.15;
        audio.play();
    }
    update_health_bar() {
        var health_bar = document.querySelector("[health-bar]");
        for (let i = 2; i >= 0; i--) {
            health_bar.children[i]["style"].backgroundColor = "";
        }
        for (let i = 2; i > 2 - this.get_health(); i--) {
            health_bar.children[i]["style"].backgroundColor = "red";
        }
    }
    check_collision() {
        e_bullets.forEach((entity, index) => {
            var o_size = entity.get_size();
            var o_pos = entity.get_position();
            var t_size = this.get_size();
            var t_pos = this.get_position();
            //(player1.x < player2.x + player2.width &&
            //player1.x + player1.width > player2.x &&
            //player1.y < player2.y + player2.height &&
            //player1.y + player1.height > player2.y)
            if (t_pos[0] < o_pos[0] + o_size[0] / 2 &&
                t_pos[0] + t_size[0] / 2 > o_pos[0] &&
                t_pos[1] < o_pos[1] + o_size[1] / 2 &&
                t_pos[1] + t_size[1] / 2 > o_pos[1]) {
                e_bullets[index].destroy();
                this.set_health(this.get_health() - 1);
                this.take_damage_flash();
                this.update_health_bar();
                var audio = new Audio('sounds/dog-hurt.m4a');
                audio.play();
                if (this.get_health() <= 0) {
                    // Game over respond
                    update_new_record(username, score);
                    open_lose_screen();
                }
                ;
                return;
            }
        });
    }
    take_damage_flash() {
        window.clearTimeout(this.flashid);
        this.sprite.style.filter = "saturate(800%)";
        this.flashid = window.setTimeout(() => { this.sprite.style.filter = ""; }, 200);
    }
    update() {
        if (laser_isshot) {
            this.pre_laser.set_position(this.get_laser_anchor());
        }
        this.check_collision();
    }
    render() { }
}
class enemy extends entity {
    constructor(renderer, id, name, size, position) {
        var health = 100;
        var damage = 10;
        var speed = 5;
        super(name, health, damage, speed, size, position);
        this.temp = document.querySelector("[enemy-template]");
        this.e_temp = this.temp.content.cloneNode(true).children[0];
        this.sprite = this.e_temp.querySelector("[sprite]");
        this.e_name = this.e_temp.querySelector("[name]");
        this.s_path = "assets/ship.webp";
        this.d_length = 50;
        this.d_count = 0;
        this.id = id;
        this.renderer = renderer;
        this.setup();
    }
    setup() {
        this.e_temp.style.left = this.get_position()[0] + "px";
        this.e_temp.style.top = this.get_position()[1] + "px";
        this.e_temp.style.width = this.get_size()[0] + "px";
        this.e_temp.style.height = this.get_size()[1] + "px";
        this.e_name.innerHTML = this.get_name();
        this.sprite.src = this.s_path;
        this.renderer.append(this.e_temp);
        // Set the direction of entity to be either left or right
        this.set_speed(this.get_speed() * this.get_direction());
        this.clockid = window.setInterval(() => this.shoot(), 1000);
        enemies_count++;
        document.querySelector('[enemy]').ondragstart = function () { return false; };
    }
    get_direction() {
        var rand = Math.random() < 0.5;
        if (rand)
            return -1;
        else
            return 1;
    }
    shoot() {
        const id = e_bullets.length;
        const height = this.get_size()[1];
        var pos = this.get_position();
        var anchor = [pos[0], pos[1] + height / 2];
        const Bullet = new bullet(this.renderer, id, "enemy", [20, 20], anchor);
        e_bullets.push(Bullet);
        var audio = new Audio('sounds/alien-gun.mp3');
        audio.volume = 0.3;
        audio.play();
    }
    take_damage_flash() {
        window.clearTimeout(this.flashid);
        this.sprite.style.filter = "saturate(800%)";
        this.flashid = window.setTimeout(() => { this.sprite.style.filter = ""; }, 200);
    }
    check_collision() {
        p_bullets.forEach((entity, index) => {
            var o_size = entity.get_size();
            var o_pos = entity.get_position();
            var t_size = this.get_size();
            var t_pos = this.get_position();
            //(player1.x < player2.x + player2.width &&
            //player1.x + player1.width > player2.x &&
            //player1.y < player2.y + player2.height &&
            //player1.y + player1.height > player2.y)
            if (t_pos[0] < o_pos[0] + o_size[0] / 2 &&
                t_pos[0] + t_size[0] / 2 > o_pos[0] &&
                t_pos[1] < o_pos[1] + o_size[1] / 2 &&
                t_pos[1] + t_size[1] / 2 > o_pos[1]) {
                if (p_bullets[index].get_name() !== 'laser') {
                    p_bullets[index].destroy();
                }
                ;
                this.set_health(this.get_health() - entity.get_damage());
                this.take_damage_flash();
                if (this.get_health() <= 0) {
                    this.destroy();
                    score++;
                    update_score();
                    var audio = new Audio('sounds/explosion.mp3');
                    audio.volume = 0.8;
                    audio.play();
                    enemies_count--;
                    if (Math.random() < 0.1) {
                        players[0].set_health(Math.min(players[0].get_health() + 1, 3));
                        players[0].update_health_bar();
                    }
                }
                ;
                return;
            }
        });
    }
    destroy() {
        window.clearInterval(this.clockid);
        this.sprite.src = "assets/explosion.webp";
        delete enemies[this.id];
        set_laser_stack(Math.min(10, laser_stack + 1));
        window.setTimeout(() => {
            this.e_temp.parentNode.removeChild(this.e_temp);
        }, 1000);
    }
    update() {
        // Enemies move left-right ubtil they bump and go downwards
        this.check_collision();
        var current_pos = this.get_position();
        this.set_position([current_pos[0] - this.get_speed(), current_pos[1]]);
        if (this.get_position()[0] - (this.get_size()[0] / 2) <= 0 || this.get_position()[0] + (this.get_size()[0] / 2) >= window.innerWidth) {
            if (this.get_speed() > 0) {
                this.set_position([this.get_size()[0] / 2, current_pos[1]]);
            }
            else {
                this.set_position([window.innerWidth - this.get_size()[0] / 2, current_pos[1]]);
            }
            this.set_speed(this.get_speed() * -1);
            this.d_count = this.d_length / Math.abs(this.get_speed());
        }
        if (this.d_count > 0) {
            this.set_position([this.get_position()[0], this.get_position()[1] + Math.abs(this.get_speed())]);
            this.d_count--;
        }
        if (current_pos[1] - (this.get_size()[1] / 2) >= window.innerHeight) {
            this.destroy();
        }
    }
    render() {
        this.e_temp.style.left = this.get_position()[0] + "px";
        this.e_temp.style.top = this.get_position()[1] + "px";
    }
}
class bullet extends entity {
    constructor(renderer, id, owner, size, position) {
        var health = 20;
        var damage = 20;
        var speed = 20;
        var name = "bullet";
        super(name, health, damage, speed, size, position);
        this.temp = document.querySelector("[bullet-template]");
        this.b_temp = this.temp.content.cloneNode(true).children[0];
        this.sprite = this.b_temp.querySelector("[sprite]");
        this.s_path = "assets/bullet.webp";
        this.renderer = renderer;
        this.id = id;
        this.owner = owner;
        this.setup();
    }
    setup() {
        this.b_temp.style.left = this.get_position()[0] + "px";
        this.b_temp.style.top = this.get_position()[1] + "px";
        this.b_temp.style.width = "20px";
        this.b_temp.style.height = "20px";
        this.sprite.src = this.s_path;
        this.renderer.append(this.b_temp);
        if (this.owner == "enemy") {
            this.sprite.style.transform = "scaleY(-1)";
            this.set_speed(this.get_speed() * -1);
        }
    }
    destroy() {
        if (this.owner == "player") {
            delete p_bullets[this.id];
        }
        else {
            delete e_bullets[this.id];
        }
        this.b_temp.parentNode.removeChild(this.b_temp);
    }
    update() {
        var current_pos = this.get_position();
        if (current_pos[1] <= 0 || current_pos[1] - this.get_size()[1] / 2 >= window.innerHeight) {
            this.destroy();
        }
        ;
        this.set_position([current_pos[0], current_pos[1] - this.get_speed()]);
    }
    render() {
        this.b_temp.style.left = this.get_position()[0] + "px";
        this.b_temp.style.top = this.get_position()[1] + "px";
    }
}
class laser extends entity {
    constructor(renderer, id, owner, size, position) {
        var health = 20;
        var damage = 20;
        var speed = 20;
        var name = "laser";
        super(name, health, damage, speed, size, position);
        this.temp = document.querySelector("[laser-template]");
        this.b_temp = this.temp.content.cloneNode(true).children[0];
        this.laser_duration = 5000;
        this.renderer = renderer;
        this.id = id;
        this.owner = owner;
        this.setup();
    }
    setup() {
        this.b_temp.style.left = this.get_position()[0] + "px";
        this.b_temp.style.top = this.get_position()[1] + "px";
        this.b_temp.style.width = this.get_size()[0] + "px";
        this.b_temp.style.height = this.get_size()[1] + "px";
        this.renderer.append(this.b_temp);
        var audio = new Audio('sounds/laser.wav');
        audio.volume = 0.8;
        audio.play();
    }
    get_laser_duration() { return this.laser_duration; }
    destroy() {
        if (this.owner == "player") {
            delete p_bullets[this.id];
        }
        else {
            delete e_bullets[this.id];
        }
        this.b_temp.classList.add("hidden");
        window.setTimeout(() => {
            laser_isshot = false;
            this.b_temp.parentNode.removeChild(this.b_temp);
        }, 1000);
    }
    update() { }
    render() {
        this.b_temp.style.left = this.get_position()[0] + "px";
        this.b_temp.style.top = this.get_position()[1] + "px";
    }
}
let mouseDown = false;
let startY, scrollTop;
const slider = document.querySelector('[result-wrapper]');
const startDragging = (e) => {
    mouseDown = true;
    startY = e.pageY - slider.offsetTop;
    scrollTop = slider.scrollTop;
};
const stopDragging = (e) => {
    mouseDown = false;
};
const move = (e) => {
    e.preventDefault();
    if (!mouseDown) {
        return;
    }
    const y = e.pageY - slider.offsetTop;
    const scroll = y - startY;
    slider.scrollTop = scrollTop - scroll;
};
// Add the event listeners
slider.addEventListener('mousemove', move, false);
slider.addEventListener('mousedown', startDragging, false);
slider.addEventListener('mouseup', stopDragging, false);
slider.addEventListener('mouseleave', stopDragging, false);
