function nthIndex(str, pat, n) {
    var L = str.length,
        i = -1;
    while (n-- && i++ < L) {
        i = str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}

type position_t =  [x: number, y: number];
type size_t = [width: number, y: number];

const fps : number = 30;
const frame_duration : number = 1000 / fps;
var start : number = Date.now();

var e_bullets : bullet[] = [];
var p_bullets : any[] = [];
var enemies : enemy[] = []; 
var players : player[] = [];
var laser_stack : number = 0;
var bark_stack : number = 0;
var score : number = 0;
var laser_isshot : boolean = false;
var bark_ready : boolean = true;

var username : string;

const pageURL : string = String(document.URL);
const mainURL : string = pageURL.substring(0, nthIndex(pageURL, '/', 3));
const ldbURL : string = mainURL + '/records';

var Game : game;
var barkid : any;
var barkcdid : any;
var cleanupid : any;

var dog_skin : string = "shiba-dog.webp";
var enemies_count : number = 0;

const enemy_names = [
    "phii",
    "lemai",
    "teo",
    "free",
    "ngou",
    "uit",
    "bk",
    "choss",
    "trau"
];

function start_game() : void {
    bark_ready = true;
    laser_stack = 10;
    bark_stack = 10;
    enemies_count = 0;
    Game = undefined;
    Game = new game();
    Game.init();
    update_laser_bar();
    update_bark_bar();
}

function clear_game() : void {
    players.forEach( (entity) => { entity.destroy() } );
    enemies.forEach( (entity) => { entity.destroy() } );
    p_bullets.forEach( (entity) => { entity.destroy() } );
    e_bullets.forEach( (entity) => { entity.destroy() } );
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

function bark() : void {
    if (bark_ready) {
        bark_ready = false;
        bark_stack = 0;
        update_bark_bar();
        var template = document.querySelector('[bark-circle]') as HTMLTemplateElement;
        var blast = (template.content.cloneNode(true) as HTMLElement).children[0] as HTMLElement;
        var player = document.querySelector('[player]') as HTMLElement;
        blast.style.left = String(players[0].get_position()[0]) + 'px';
        blast.style.top = String(players[0].get_position()[1]) + 'px';
        var renderer = document.querySelector('[game-screen]')
        renderer.append(blast);
        var bark_audio = new Audio('sounds/bark.mp3');
        bark_audio.play();
        e_bullets.forEach( (entity) => { entity.destroy() } );
        barkcdid = window.setTimeout(() => { bark_ready = true }, 10000);
        barkid = window.setInterval(() => {
            bark_stack = Math.min(bark_stack+1, 10);
            update_bark_bar();
        }, 1000);
        window.setTimeout(() => { window.clearInterval(barkid) }, 10000);
        window.setTimeout(() => { blast.parentNode.removeChild(blast) }, 1000);
    }
}

function option_func(self : any) : void {
    var options = Array.from(document.querySelector('[option-container]').children);
    options.forEach((option) => { option.classList.remove('choosen') }); 
    self.classList.toggle('choosen');
    dog_skin = self.getAttribute('skin');
}

function open_guide_screen() : void {
    document.querySelector('[guide-screen]').classList.toggle('active');
}

function close_guide_screen() : void {
    document.querySelector('[guide-screen]').classList.remove('active');
}

function open_skin_screen() : void {
    document.querySelector('[skin-screen]').classList.toggle('active');
}

function close_skin_screen() : void {
    document.querySelector('[skin-screen]').classList.remove('active');
}


function open_lose_screen() : void {
    clear_game();
    document.querySelector("[lose-screen]").classList.toggle("active");
}

function close_lose_screen() : void {
    document.querySelector("[lose-screen]").classList.remove("active");
}

function open_menu_screen() : void { 
    document.querySelector("[menu-screen]").classList.toggle("active");
    update_leader_board();
}

function close_menu_screen() : void { 
    document.querySelector("[menu-screen]").classList.remove("active");
}

function restart_button_func() : void {
    start_game();
    close_lose_screen();
}

function play_button_func() : void {
    var data = (document.getElementById("search") as HTMLInputElement).value;
    if (data.length > 0) {
        username = data;
        close_menu_screen();
        start_game();
    }
}

function menu_button_func() : void {
    close_lose_screen();
    open_menu_screen();
}

function set_laser_stack(count : number) : void {
    laser_stack = count;
    update_laser_bar();
}

function update_laser_bar() : void { 
    var laser_bar = document.querySelector("[mana-bar]");
    for (let i=9; i>=0; i--) {
        laser_bar.children[i]["style"].backgroundColor = "";
    }
    for (let i=9; i>9-laser_stack; i--) {
        laser_bar.children[i]["style"].backgroundColor = "yellow";
    }
}

function update_score() : void {
    document.querySelector("[score]").innerHTML = "SCORE: " + score;
}

function update_bark_bar() : void {
    var bark_bar = document.querySelector("[bark-bar]");
    for (let i=9; i>=0; i--) {
        bark_bar.children[i]["style"].backgroundColor = "";
    }
    for (let i=9; i>9-bark_stack; i--) {
        bark_bar.children[i]["style"].backgroundColor = "blue";
    }
}

function update_leader_board() : void {
    clear_leader_board();
    fetch (ldbURL)
        .then(res => res.json())
        .then(data => {
            var items = Object.keys(data).map(function(key) { return [key, data[key]]; });
            items.sort(function(first, second) { return first[1] - second[1] });
            for (let i=items.length-1; i>=0; i--) {
                add_leader_board_card(items.length-i, items[i][0], items[i][1]);
            }
        })
}

function clear_leader_board() : void {
    const container = document.querySelector("[result-container]");
    container.innerHTML = "";
}

function add_leader_board_card(rank : number, name : string, score : number) {
    const template = document.querySelector("[result-card-template]") as HTMLTemplateElement; 
    const card = (template.content.cloneNode(true) as HTMLElement).children[0];
    const card_rank = card.querySelector("[data-rank]");
    const card_name = card.querySelector("[data-name]");
    const card_score = card.querySelector("[data-score]");

    card_rank.textContent = String(rank);
    card_name.textContent = String(name);
    card_score.textContent = String(score);

    const container = document.querySelector("[result-container]");
    container.append(card);
}

function update_new_record(name : string, score : number) : void {
    var destination = mainURL + '/' + 'upload';
    var req = new XMLHttpRequest();
    var data = JSON.stringify({'name': name, 'score': score});

    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            if(req.status == 200) { }
            else console.log("Problem occured while uploading record!");
        }
    };
    
    req.open("post", destination, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(data);
}

update_leader_board();

function save_high_score() : void {
}

class game {
    private renderer : any = document.querySelector("[game-screen]");
    private Player : player;
    private spawnid : any;

    public constructor() {
        this.Player = new player(this.renderer, "kato", [42, 75], [500, 500]);
        players.push(this.Player);
    }

    public init() : void {
        this.game_loop();
        this.spawnid = window.setInterval(() => { this.enemy_spawn() }, 1000);
    }

    public destroy() : void {
        window.clearInterval(this.spawnid);
        this.Player = null;
    }

    public enemy_spawn() : void {
        var capacity : number = 50;
        var ran_name : number = Math.floor(Math.random() * enemy_names.length);
        var ran : number = Math.floor(Math.random() * window.innerWidth);
        if (enemies_count <= capacity) {
            var Enemy : enemy = new enemy(this.renderer, enemies.length, enemy_names[ran_name], [100, 100], [ran, 100]);
            enemies.push(Enemy);
        }
    }

    public game_loop() : void {
        requestAnimationFrame(() => this.game_loop());
        var current : number = Date.now();
        var elapsed : number = current - start;
        if (elapsed > frame_duration) {
            this.update();
            this.render();
            start = current;
        }
    }

    public update() : void {
        players.forEach( (entity) => { entity.update() } );
        enemies.forEach( (entity) => { entity.update() } );
        p_bullets.forEach( (entity) => { entity.update() } );
        e_bullets.forEach( (entity) => { entity.update() } );
    }

    public render() : void {
        players.forEach( (entity) => { entity.render() } );
        enemies.forEach( (entity) => { entity.render() } );
        p_bullets.forEach( (entity) => { entity.render() } );
        e_bullets.forEach( (entity) => { entity.render() } );
    }
}

abstract class entity {
    private name : string;
    private health : number;
    private damage : number;
    private speed : number;
    private size : size_t
    private position : position_t;

    public constructor(name : string, health : number, damage : number, speed : number, size : size_t, position: position_t) {
        this.name = name;
        this.health = health;
        this.damage = damage;
        this.speed = speed;
        this.position = position;
        this.size = size;
    }

    public get_name() : string { return this.name; }
    public get_health() : number { return this.health; }
    public get_damage() : number { return this.damage; }
    public get_position() : position_t { return this.position; }
    public get_size() : size_t { return this.size; }
    public get_speed() : number { return this.speed; }

    public set_size(size: size_t) : void { this.size = size; }
    public set_position(position: position_t) : void { this.position = position; }
    public set_health(health: number) : void { this.health = health; }
    public set_damage(damage: number) : void { this.damage = damage; }
    public set_speed(speed: number) : void { this.speed = speed; }

    public abstract update() : void;
    public abstract render(renderer : any) : void;
}

class player extends entity {
    protected temp : any = document.querySelector("[player-template]");
    protected screen : any = document.querySelector("[touch]");
    protected p_temp : any = this.temp.content.cloneNode(true).children[0];
    protected sprite : any = this.p_temp.querySelector("[sprite]");
    protected s_path : string = "assets/dogs/" + dog_skin;
    protected pre_laser : laser;
    protected laserid : any;
    protected shootid : any;
    protected flashid : any;
    protected renderer : any;


    public constructor(renderer : any, name : string, size : size_t, position: position_t) {
        var health : number = 3;
        var damage : number = 10;
        var speed : number = 5;
        super(name, health, damage, speed, size, position);
        this.renderer = renderer;
        this.setup();
    }

    
    public setup() : void {
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
            }, {duration: 0, fill: "forwards"})

        }

        this.p_temp.addEventListener('mousedown', (event) => {
            if (event.button === 0) { this.fire_laser() }
        });

        var game_screen : any = document.querySelector('[game-screen]');
        document.body.addEventListener('keydown',  function(e) {
            if (e.key == ' ' || e.code == 'Space' || e.keyCode == 32) { bark() };
        });

        this.sprite.src = this.s_path;
        this.renderer.append(this.p_temp);
        this.auto_shoot();
        this.update_health_bar();


        (document.querySelector('[player]') as HTMLElement).ondragstart = function() { return false; };
    }


    public destroy() : void {
        laser_isshot = false;
        this.p_temp.parentNode.removeChild(this.p_temp);
        window.clearTimeout(this.flashid);
        window.clearInterval(this.shootid);
        window.clearTimeout(this.laserid);
    }
    
    public get_anchor() : position_t {
        const height : number = this.get_size()[1];
        var pos : position_t = this.get_position();
        var anchor : position_t = [pos[0], pos[1] - height / 2];
        return anchor;
    }

    public fire_laser() : void {;
        if (laser_stack === 10 && laser_isshot === false) {
            laser_isshot = true;
            window.clearInterval(this.shootid);
            const id : number = p_bullets.length;
            const Laser : laser = new laser(
                this.renderer, id, "player", 
                [60, window.innerHeight + 9999], 
                [this.get_anchor()[0], this.get_anchor()[1] - window.innerHeight/2 - 9999]); 

            this.pre_laser = Laser;
            p_bullets.push(Laser);
            this.laserid = window.setTimeout(() => {this.laser_off()}, this.pre_laser.get_laser_duration());
        }
    }

    public get_laser_anchor() : position_t {
            var current_pos : position_t = this.get_anchor();
            var new_pos : position_t = [current_pos[0], current_pos[1] - this.pre_laser.get_size()[1]/2];
            return new_pos
    }

    public laser_off() : void {
        set_laser_stack(0);
        this.pre_laser.destroy();
        this.auto_shoot();
    }


    public bite() : void {
    }

    public auto_shoot() : void {
        this.shootid = window.setInterval(() => this.shoot(), 120);
    }

    public shoot() : void {
        const id : number = p_bullets.length;
        const Bullet : bullet = new bullet(this.renderer, id, "player", [20, 20], this.get_anchor()); 
        p_bullets.push(Bullet);
        var audio = new Audio('sounds/gun.mp3');
        audio.volume = 0.15;
        audio.play();
    }

    public update_health_bar() : void { 
        var health_bar = document.querySelector("[health-bar]");
        for (let i=2; i>=0; i--) {
            health_bar.children[i]["style"].backgroundColor = "";
        }
        for (let i=2; i>2-this.get_health(); i--) {
            health_bar.children[i]["style"].backgroundColor = "red";
        }
    }

    public check_collision() : void {
        e_bullets.forEach( (entity, index) => {
            var o_size : size_t = entity.get_size();
            var o_pos : position_t = entity.get_position();
            var t_size : size_t = this.get_size();
            var t_pos : position_t = this.get_position();

            //(player1.x < player2.x + player2.width &&
            //player1.x + player1.width > player2.x &&
            //player1.y < player2.y + player2.height &&
            //player1.y + player1.height > player2.y)

            if (t_pos[0] < o_pos[0] + o_size[0]/2 &&
                t_pos[0] + t_size[0]/2 > o_pos[0] &&
                t_pos[1] < o_pos[1] + o_size[1]/2 &&
                t_pos[1] + t_size[1]/2 > o_pos[1])
            {
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
                };
                return;
            }
        });
    }

    public take_damage_flash() : void { 
        window.clearTimeout(this.flashid);
        this.sprite.style.filter = "saturate(800%)";
        this.flashid = window.setTimeout(() => { this.sprite.style.filter = "" }, 200);
    }

    public update() : void {
        if (laser_isshot) { this.pre_laser.set_position(this.get_laser_anchor()); }
        this.check_collision();
    }

    public render() : void { }
}

class enemy extends entity {
    protected temp : any = document.querySelector("[enemy-template]");
    protected e_temp : any = this.temp.content.cloneNode(true).children[0];
    protected sprite : any = this.e_temp.querySelector("[sprite]");
    protected e_name : any = this.e_temp.querySelector("[name]");
    protected s_path : string = "assets/ship.webp";
    protected d_length : number = 50;
    protected d_count : number = 0;
    protected id : number;
    protected renderer : any;
    protected clockid : any;
    protected flashid : any;

    public constructor(renderer : any, id : number, name : string, size : size_t, position: position_t) {
        var health : number = 100;
        var damage : number = 10;
        var speed : number = 5;
        super(name, health, damage, speed, size, position);
        this.id = id;
        this.renderer = renderer;
        this.setup();
    }

    public setup() : void {
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

        (document.querySelector('[enemy]') as HTMLElement).ondragstart = function() { return false; };
    }

    public get_direction() : number {
        var rand : boolean = Math.random() < 0.5;
        if (rand) return -1;
        else return 1;
    }

    public shoot() : void {
        const id : number = e_bullets.length;
        const height : number = this.get_size()[1];
        var pos : position_t = this.get_position();
        var anchor : position_t = [pos[0], pos[1] + height / 2];
        const Bullet : bullet = new bullet(this.renderer, id, "enemy", [20, 20], anchor); 
        e_bullets.push(Bullet);
        var audio = new Audio('sounds/alien-gun.mp3');
        audio.volume = 0.3;
        audio.play();
    }

    public take_damage_flash() : void { 
        window.clearTimeout(this.flashid);
        this.sprite.style.filter = "saturate(800%)";
        this.flashid = window.setTimeout(() => { this.sprite.style.filter = "" }, 200);
    }

    public check_collision() : void {
        p_bullets.forEach( (entity, index) => {
            var o_size : size_t = entity.get_size();
            var o_pos : position_t = entity.get_position();
            var t_size : size_t = this.get_size();
            var t_pos : position_t = this.get_position();

            //(player1.x < player2.x + player2.width &&
            //player1.x + player1.width > player2.x &&
            //player1.y < player2.y + player2.height &&
            //player1.y + player1.height > player2.y)

            if (t_pos[0] < o_pos[0] + o_size[0]/2 &&
                t_pos[0] + t_size[0]/2 > o_pos[0] &&
                t_pos[1] < o_pos[1] + o_size[1]/2 &&
                t_pos[1] + t_size[1]/2 > o_pos[1])
            {
                if (p_bullets[index].get_name() !== 'laser') { p_bullets[index].destroy() };
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
                        players[0].set_health(Math.min(players[0].get_health()+1, 3));
                        players[0].update_health_bar();
                    }
                };
                return;
            }
        });
    }

    public destroy() : void {
        window.clearInterval(this.clockid);
        this.sprite.src = "assets/explosion.webp"; 
        delete enemies[this.id];

        set_laser_stack(Math.min(10, laser_stack+1));

        window.setTimeout(() => {
            this.e_temp.parentNode.removeChild(this.e_temp);
        }, 1000);
    }
    
    public update() : void {
        // Enemies move left-right ubtil they bump and go downwards
        this.check_collision();
        var current_pos : position_t = this.get_position();
        this.set_position([current_pos[0] - this.get_speed(), current_pos[1]]);
        if (this.get_position()[0] - (this.get_size()[0] / 2) <= 0 || this.get_position()[0] + (this.get_size()[0] / 2) >= window.innerWidth) {
            if (this.get_speed() > 0) { this.set_position([this.get_size()[0]/2, current_pos[1]]) }
            else { this.set_position([window.innerWidth-this.get_size()[0]/2, current_pos[1]]) }
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

    public render() : void {
        this.e_temp.style.left = this.get_position()[0] + "px";
        this.e_temp.style.top = this.get_position()[1] + "px";
    }
}

class bullet extends entity {
    protected temp : any = document.querySelector("[bullet-template]");
    protected b_temp : any = this.temp.content.cloneNode(true).children[0];
    protected sprite : any = this.b_temp.querySelector("[sprite]");
    protected s_path : string = "assets/bullet.webp";
    protected renderer : any;
    protected id : number;
    protected owner : string;

    public constructor(renderer : any, id : number, owner : string, size : size_t, position: position_t) {
        var health : number = 20;
        var damage : number = 20;
        var speed : number = 20;
        var name : string = "bullet";
        super(name, health, damage, speed, size, position);
        this.renderer = renderer;
        this.id = id;
        this.owner = owner;
        this.setup();
    }

    public setup() : void {
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

    public destroy() : void {
        if (this.owner == "player") { delete p_bullets[this.id]; }
        else { delete e_bullets[this.id]; }
        this.b_temp.parentNode.removeChild(this.b_temp);
    }

    public update() : void {
        var current_pos : position_t = this.get_position();
        if (current_pos[1] <= 0 || current_pos[1] - this.get_size()[1] / 2 >= window.innerHeight) { this.destroy() };
        this.set_position([current_pos[0], current_pos[1] - this.get_speed()]);
    }

    public render() : void {
        this.b_temp.style.left = this.get_position()[0] + "px";
        this.b_temp.style.top = this.get_position()[1] + "px";
    }
}

class laser extends entity {
    protected temp : any = document.querySelector("[laser-template]");
    protected b_temp : any = this.temp.content.cloneNode(true).children[0];
    protected laser_duration : number = 5000;
    protected renderer : any;
    protected id : number;
    protected owner : string;

    public constructor(renderer : any, id : number, owner : string, size : size_t, position: position_t) {
        var health : number = 20;
        var damage : number = 20;
        var speed : number = 20;
        var name : string = "laser";
        super(name, health, damage, speed, size, position);
        this.renderer = renderer;
        this.id = id;
        this.owner = owner;
        this.setup();
    }

    public setup() : void {
        this.b_temp.style.left = this.get_position()[0] + "px";
        this.b_temp.style.top = this.get_position()[1] + "px";
        this.b_temp.style.width = this.get_size()[0] + "px";
        this.b_temp.style.height = this.get_size()[1] + "px";
        this.renderer.append(this.b_temp);

        var audio = new Audio('sounds/laser.wav');
        audio.volume = 0.8;
        audio.play();
    }

    public get_laser_duration() : number { return this.laser_duration }

    public destroy() : void {
        if (this.owner == "player") { delete p_bullets[this.id]; }
        else { delete e_bullets[this.id]; }
        this.b_temp.classList.add("hidden");
        window.setTimeout(() => {
            laser_isshot = false
            this.b_temp.parentNode.removeChild(this.b_temp);
        }, 1000);
    }

    public update() : void { }

    public render() : void {
        this.b_temp.style.left = this.get_position()[0] + "px";
        this.b_temp.style.top = this.get_position()[1] + "px";
    }
}

let mouseDown = false;
let startY, scrollTop;
const slider = document.querySelector('[result-wrapper]') as HTMLElement;

const startDragging = (e) => {
  mouseDown = true;
  startY = e.pageY - slider.offsetTop;
  scrollTop = slider.scrollTop;
}

const stopDragging = (e) => {
  mouseDown = false;
}

const move = (e) => {
  e.preventDefault();
  if(!mouseDown) { return; }
  const y = e.pageY - slider.offsetTop;
  const scroll = y - startY;
  slider.scrollTop = scrollTop - scroll;
}

// Add the event listeners
slider.addEventListener('mousemove', move, false);
slider.addEventListener('mousedown', startDragging, false);
slider.addEventListener('mouseup', stopDragging, false);
slider.addEventListener('mouseleave', stopDragging, false);

