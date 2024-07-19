type position_t =  [x: number, y: number];
type size_t = [width: number, y: number];

const fps : number = 30;
const frame_duration : number = 1000 / fps;
var start : number = Date.now();

var e_bullets : bullet[] = [];
var p_bullets : any[] = [];
var enemies : enemy[] = []; 
var players : player[] = [];
var laser_stack : number = 10;
var laser_isshot : boolean = false;

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

update_laser_bar();

class game {
    private renderer : any = document.querySelector("[game-screen]");

    public constructor() {
        var Player : player = new player(this.renderer, "kato", [42, 75], [500, 500]);
        players.push(Player);
    }

    public init() : void {
        this.game_loop();

        //for (let i=0; i<100; i++) { this.enemy_spawn(); };
        window.setInterval(() => { this.enemy_spawn() }, 1000);
        //this.enemy_spawn()
    }

    public enemy_spawn() : void {
        var ran : number = Math.floor(Math.random() * window.innerWidth);
        var Enemy : enemy = new enemy(this.renderer, enemies.length, "phi", [100, 100], [ran, 100]);
        enemies.push(Enemy);
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
    protected p_temp : any = this.temp.content.cloneNode(true).children[0];
    protected sprite : any = this.p_temp.querySelector("[sprite]");
    protected s_path : string = "assets/dog.webp";
    protected pre_laser : laser;
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

        document.addEventListener('mousedown', (event) => {
            if (event.button === 0 && laser_isshot === false) { this.fire_laser() };
        });

        this.sprite.src = this.s_path;
        this.renderer.append(this.p_temp);
        this.auto_shoot();
        this.update_health_bar();
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
                [60, window.innerHeight], 
                [this.get_anchor()[0], this.get_anchor()[1] - window.innerHeight/2]); 

            this.pre_laser = Laser;
            p_bullets.push(Laser);
            window.setTimeout(() => {this.laser_off()}, this.pre_laser.get_laser_duration());
        }
    }

    public get_laser_anchor() : position_t {
            var current_pos : position_t = this.get_anchor();
            var new_pos : position_t = [current_pos[0], current_pos[1] - this.pre_laser.get_size()[1]/2];
            return new_pos
    }

    public laser_off() : void {
        set_laser_stack(0);
        this.pre_laser.shutdown();
        this.auto_shoot();
    }

    public auto_shoot() : void {
        this.shootid = window.setInterval(() => this.shoot(), 120);
    }

    public shoot() : void {
        const id : number = p_bullets.length;
        const Bullet : bullet = new bullet(this.renderer, id, "player", [20, 20], this.get_anchor()); 
        p_bullets.push(Bullet);
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
                if (this.get_health() <= 0) {
                    console.log("you lost") 
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
                p_bullets[index].destroy();
                this.set_health(this.get_health() - entity.get_damage());
                this.take_damage_flash();
                if (this.get_health() <= 0) { this.destroy(); };
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

        //if (this.owner == "enemy") {
            //this.sprite.style.transform = "scaleY(-1)";
            //this.set_speed(this.get_speed() * -1);
        //}
    }

    public get_laser_duration() : number { return this.laser_duration }

    public destroy() : void { }

    public shutdown() : void {
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

const Game : game = new game();
Game.init();
