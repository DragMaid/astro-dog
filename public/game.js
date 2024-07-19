var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var fps = 30;
var frame_duration = 1000 / fps;
var start = Date.now();
var e_bullets = [];
var p_bullets = [];
var enemies = [];
var players = [];
var laser_stack = 10;
var laser_isshot = false;
function set_laser_stack(count) {
    laser_stack = count;
    update_laser_bar();
}
function update_laser_bar() {
    var laser_bar = document.querySelector("[mana-bar]");
    for (var i = 9; i >= 0; i--) {
        laser_bar.children[i]["style"].backgroundColor = "";
    }
    for (var i = 9; i > 9 - laser_stack; i--) {
        laser_bar.children[i]["style"].backgroundColor = "yellow";
    }
}
update_laser_bar();
var game = /** @class */ (function () {
    function game() {
        this.renderer = document.querySelector("[game-screen]");
        var Player = new player(this.renderer, "kato", [42, 75], [500, 500]);
        players.push(Player);
    }
    game.prototype.init = function () {
        var _this = this;
        this.game_loop();
        //for (let i=0; i<100; i++) { this.enemy_spawn(); };
        window.setInterval(function () { _this.enemy_spawn(); }, 1000);
        //this.enemy_spawn()
    };
    game.prototype.enemy_spawn = function () {
        var ran = Math.floor(Math.random() * window.innerWidth);
        var Enemy = new enemy(this.renderer, enemies.length, "phi", [100, 100], [ran, 100]);
        enemies.push(Enemy);
    };
    game.prototype.game_loop = function () {
        var _this = this;
        requestAnimationFrame(function () { return _this.game_loop(); });
        var current = Date.now();
        var elapsed = current - start;
        if (elapsed > frame_duration) {
            this.update();
            this.render();
            start = current;
        }
    };
    game.prototype.update = function () {
        players.forEach(function (entity) { entity.update(); });
        enemies.forEach(function (entity) { entity.update(); });
        p_bullets.forEach(function (entity) { entity.update(); });
        e_bullets.forEach(function (entity) { entity.update(); });
    };
    game.prototype.render = function () {
        players.forEach(function (entity) { entity.render(); });
        enemies.forEach(function (entity) { entity.render(); });
        p_bullets.forEach(function (entity) { entity.render(); });
        e_bullets.forEach(function (entity) { entity.render(); });
    };
    return game;
}());
var entity = /** @class */ (function () {
    function entity(name, health, damage, speed, size, position) {
        this.name = name;
        this.health = health;
        this.damage = damage;
        this.speed = speed;
        this.position = position;
        this.size = size;
    }
    entity.prototype.get_name = function () { return this.name; };
    entity.prototype.get_health = function () { return this.health; };
    entity.prototype.get_damage = function () { return this.damage; };
    entity.prototype.get_position = function () { return this.position; };
    entity.prototype.get_size = function () { return this.size; };
    entity.prototype.get_speed = function () { return this.speed; };
    entity.prototype.set_size = function (size) { this.size = size; };
    entity.prototype.set_position = function (position) { this.position = position; };
    entity.prototype.set_health = function (health) { this.health = health; };
    entity.prototype.set_damage = function (damage) { this.damage = damage; };
    entity.prototype.set_speed = function (speed) { this.speed = speed; };
    return entity;
}());
var player = /** @class */ (function (_super) {
    __extends(player, _super);
    function player(renderer, name, size, position) {
        var _this = this;
        var health = 3;
        var damage = 10;
        var speed = 5;
        _this = _super.call(this, name, health, damage, speed, size, position) || this;
        _this.temp = document.querySelector("[player-template]");
        _this.p_temp = _this.temp.content.cloneNode(true).children[0];
        _this.sprite = _this.p_temp.querySelector("[sprite]");
        _this.s_path = "assets/dog.webp";
        _this.renderer = renderer;
        _this.setup();
        return _this;
    }
    player.prototype.setup = function () {
        var _this = this;
        this.p_temp.style.left = this.get_position()[0] + "px";
        this.p_temp.style.top = this.get_position()[1] + "px";
        this.p_temp.style.width = this.get_size()[0] + "px";
        this.p_temp.style.height = this.get_size()[1] + "px";
        document.body.onpointermove = function (event) {
            var clientX = event.clientX, clientY = event.clientY;
            _this.set_position([clientX, clientY]);
            _this.p_temp.animate({
                left: "".concat(clientX, "px"),
                top: "".concat(clientY, "px")
            }, { duration: 0, fill: "forwards" });
        };
        document.addEventListener('mousedown', function (event) {
            if (event.button === 0 && laser_isshot === false) {
                _this.fire_laser();
            }
            ;
        });
        this.sprite.src = this.s_path;
        this.renderer.append(this.p_temp);
        this.auto_shoot();
        this.update_health_bar();
    };
    player.prototype.get_anchor = function () {
        var height = this.get_size()[1];
        var pos = this.get_position();
        var anchor = [pos[0], pos[1] - height / 2];
        return anchor;
    };
    player.prototype.fire_laser = function () {
        var _this = this;
        ;
        if (laser_stack === 10 && laser_isshot === false) {
            laser_isshot = true;
            window.clearInterval(this.shootid);
            var id = p_bullets.length;
            var Laser = new laser(this.renderer, id, "player", [60, window.innerHeight], [this.get_anchor()[0], this.get_anchor()[1] - window.innerHeight / 2]);
            this.pre_laser = Laser;
            p_bullets.push(Laser);
            window.setTimeout(function () { _this.laser_off(); }, this.pre_laser.get_laser_duration());
        }
    };
    player.prototype.get_laser_anchor = function () {
        var current_pos = this.get_anchor();
        var new_pos = [current_pos[0], current_pos[1] - this.pre_laser.get_size()[1] / 2];
        return new_pos;
    };
    player.prototype.laser_off = function () {
        set_laser_stack(0);
        this.pre_laser.shutdown();
        this.auto_shoot();
    };
    player.prototype.auto_shoot = function () {
        var _this = this;
        this.shootid = window.setInterval(function () { return _this.shoot(); }, 120);
    };
    player.prototype.shoot = function () {
        var id = p_bullets.length;
        var Bullet = new bullet(this.renderer, id, "player", [20, 20], this.get_anchor());
        p_bullets.push(Bullet);
    };
    player.prototype.update_health_bar = function () {
        var health_bar = document.querySelector("[health-bar]");
        for (var i = 2; i >= 0; i--) {
            health_bar.children[i]["style"].backgroundColor = "";
        }
        for (var i = 2; i > 2 - this.get_health(); i--) {
            health_bar.children[i]["style"].backgroundColor = "red";
        }
    };
    player.prototype.check_collision = function () {
        var _this = this;
        e_bullets.forEach(function (entity, index) {
            var o_size = entity.get_size();
            var o_pos = entity.get_position();
            var t_size = _this.get_size();
            var t_pos = _this.get_position();
            //(player1.x < player2.x + player2.width &&
            //player1.x + player1.width > player2.x &&
            //player1.y < player2.y + player2.height &&
            //player1.y + player1.height > player2.y)
            if (t_pos[0] < o_pos[0] + o_size[0] / 2 &&
                t_pos[0] + t_size[0] / 2 > o_pos[0] &&
                t_pos[1] < o_pos[1] + o_size[1] / 2 &&
                t_pos[1] + t_size[1] / 2 > o_pos[1]) {
                e_bullets[index].destroy();
                _this.set_health(_this.get_health() - 1);
                _this.take_damage_flash();
                _this.update_health_bar();
                if (_this.get_health() <= 0) {
                    console.log("you lost");
                }
                ;
                return;
            }
        });
    };
    player.prototype.take_damage_flash = function () {
        var _this = this;
        window.clearTimeout(this.flashid);
        this.sprite.style.filter = "saturate(800%)";
        this.flashid = window.setTimeout(function () { _this.sprite.style.filter = ""; }, 200);
    };
    player.prototype.update = function () {
        if (laser_isshot) {
            this.pre_laser.set_position(this.get_laser_anchor());
        }
        this.check_collision();
    };
    player.prototype.render = function () { };
    return player;
}(entity));
var enemy = /** @class */ (function (_super) {
    __extends(enemy, _super);
    function enemy(renderer, id, name, size, position) {
        var _this = this;
        var health = 100;
        var damage = 10;
        var speed = 5;
        _this = _super.call(this, name, health, damage, speed, size, position) || this;
        _this.temp = document.querySelector("[enemy-template]");
        _this.e_temp = _this.temp.content.cloneNode(true).children[0];
        _this.sprite = _this.e_temp.querySelector("[sprite]");
        _this.e_name = _this.e_temp.querySelector("[name]");
        _this.s_path = "assets/ship.webp";
        _this.d_length = 50;
        _this.d_count = 0;
        _this.id = id;
        _this.renderer = renderer;
        _this.setup();
        return _this;
    }
    enemy.prototype.setup = function () {
        var _this = this;
        this.e_temp.style.left = this.get_position()[0] + "px";
        this.e_temp.style.top = this.get_position()[1] + "px";
        this.e_temp.style.width = this.get_size()[0] + "px";
        this.e_temp.style.height = this.get_size()[1] + "px";
        this.e_name.innerHTML = this.get_name();
        this.sprite.src = this.s_path;
        this.renderer.append(this.e_temp);
        // Set the direction of entity to be either left or right
        this.set_speed(this.get_speed() * this.get_direction());
        this.clockid = window.setInterval(function () { return _this.shoot(); }, 1000);
    };
    enemy.prototype.get_direction = function () {
        var rand = Math.random() < 0.5;
        if (rand)
            return -1;
        else
            return 1;
    };
    enemy.prototype.shoot = function () {
        var id = e_bullets.length;
        var height = this.get_size()[1];
        var pos = this.get_position();
        var anchor = [pos[0], pos[1] + height / 2];
        var Bullet = new bullet(this.renderer, id, "enemy", [20, 20], anchor);
        e_bullets.push(Bullet);
    };
    enemy.prototype.take_damage_flash = function () {
        var _this = this;
        window.clearTimeout(this.flashid);
        this.sprite.style.filter = "saturate(800%)";
        this.flashid = window.setTimeout(function () { _this.sprite.style.filter = ""; }, 200);
    };
    enemy.prototype.check_collision = function () {
        var _this = this;
        p_bullets.forEach(function (entity, index) {
            var o_size = entity.get_size();
            var o_pos = entity.get_position();
            var t_size = _this.get_size();
            var t_pos = _this.get_position();
            //(player1.x < player2.x + player2.width &&
            //player1.x + player1.width > player2.x &&
            //player1.y < player2.y + player2.height &&
            //player1.y + player1.height > player2.y)
            if (t_pos[0] < o_pos[0] + o_size[0] / 2 &&
                t_pos[0] + t_size[0] / 2 > o_pos[0] &&
                t_pos[1] < o_pos[1] + o_size[1] / 2 &&
                t_pos[1] + t_size[1] / 2 > o_pos[1]) {
                p_bullets[index].destroy();
                _this.set_health(_this.get_health() - entity.get_damage());
                _this.take_damage_flash();
                if (_this.get_health() <= 0) {
                    _this.destroy();
                }
                ;
                return;
            }
        });
    };
    enemy.prototype.destroy = function () {
        var _this = this;
        window.clearInterval(this.clockid);
        this.sprite.src = "assets/explosion.webp";
        delete enemies[this.id];
        set_laser_stack(Math.min(10, laser_stack + 1));
        window.setTimeout(function () {
            _this.e_temp.parentNode.removeChild(_this.e_temp);
        }, 1000);
    };
    enemy.prototype.update = function () {
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
    };
    enemy.prototype.render = function () {
        this.e_temp.style.left = this.get_position()[0] + "px";
        this.e_temp.style.top = this.get_position()[1] + "px";
    };
    return enemy;
}(entity));
var bullet = /** @class */ (function (_super) {
    __extends(bullet, _super);
    function bullet(renderer, id, owner, size, position) {
        var _this = this;
        var health = 20;
        var damage = 20;
        var speed = 20;
        var name = "bullet";
        _this = _super.call(this, name, health, damage, speed, size, position) || this;
        _this.temp = document.querySelector("[bullet-template]");
        _this.b_temp = _this.temp.content.cloneNode(true).children[0];
        _this.sprite = _this.b_temp.querySelector("[sprite]");
        _this.s_path = "assets/bullet.webp";
        _this.renderer = renderer;
        _this.id = id;
        _this.owner = owner;
        _this.setup();
        return _this;
    }
    bullet.prototype.setup = function () {
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
    };
    bullet.prototype.destroy = function () {
        if (this.owner == "player") {
            delete p_bullets[this.id];
        }
        else {
            delete e_bullets[this.id];
        }
        this.b_temp.parentNode.removeChild(this.b_temp);
    };
    bullet.prototype.update = function () {
        var current_pos = this.get_position();
        if (current_pos[1] <= 0 || current_pos[1] - this.get_size()[1] / 2 >= window.innerHeight) {
            this.destroy();
        }
        ;
        this.set_position([current_pos[0], current_pos[1] - this.get_speed()]);
    };
    bullet.prototype.render = function () {
        this.b_temp.style.left = this.get_position()[0] + "px";
        this.b_temp.style.top = this.get_position()[1] + "px";
    };
    return bullet;
}(entity));
var laser = /** @class */ (function (_super) {
    __extends(laser, _super);
    function laser(renderer, id, owner, size, position) {
        var _this = this;
        var health = 20;
        var damage = 20;
        var speed = 20;
        var name = "laser";
        _this = _super.call(this, name, health, damage, speed, size, position) || this;
        _this.temp = document.querySelector("[laser-template]");
        _this.b_temp = _this.temp.content.cloneNode(true).children[0];
        _this.laser_duration = 5000;
        _this.renderer = renderer;
        _this.id = id;
        _this.owner = owner;
        _this.setup();
        return _this;
    }
    laser.prototype.setup = function () {
        this.b_temp.style.left = this.get_position()[0] + "px";
        this.b_temp.style.top = this.get_position()[1] + "px";
        this.b_temp.style.width = this.get_size()[0] + "px";
        this.b_temp.style.height = this.get_size()[1] + "px";
        this.renderer.append(this.b_temp);
        //if (this.owner == "enemy") {
        //this.sprite.style.transform = "scaleY(-1)";
        //this.set_speed(this.get_speed() * -1);
        //}
    };
    laser.prototype.get_laser_duration = function () { return this.laser_duration; };
    laser.prototype.destroy = function () { };
    laser.prototype.shutdown = function () {
        var _this = this;
        if (this.owner == "player") {
            delete p_bullets[this.id];
        }
        else {
            delete e_bullets[this.id];
        }
        this.b_temp.classList.add("hidden");
        window.setTimeout(function () {
            laser_isshot = false;
            _this.b_temp.parentNode.removeChild(_this.b_temp);
        }, 1000);
    };
    laser.prototype.update = function () { };
    laser.prototype.render = function () {
        this.b_temp.style.left = this.get_position()[0] + "px";
        this.b_temp.style.top = this.get_position()[1] + "px";
    };
    return laser;
}(entity));
var Game = new game();
Game.init();
