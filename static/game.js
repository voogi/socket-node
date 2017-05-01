let Container = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Texture = PIXI.Texture,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text,
    Graphics = PIXI.Graphics;
AnimatedSprite = PIXI.extras.AnimatedSprite;

let UTILS;


let Game = function () {

    this.renderer = null;
    this.stage = null;
    this.gameScene = null;
    this.healthBar = {};
    this.socket = null;
    this.otherPlayers = {};
    this.projectiles = [];
    this.keys = {};
    this.started = false;

    //objects
    this.player = new Sprite();

    this.playerProps = {
        weapon : Weapon.PISTOL,
        lastShootTime: 0,
        name: "",
        health: 100,
        speed: 5
    };

    return this;
};

Game.prototype = {
    init: function (opts) {

        this.renderer = autoDetectRenderer(opts.width, opts.height, {backgroundColor: 0x2d4738});
        this.stage = new Container();

        this.renderer.view.style.position = "absolute";
        this.renderer.view.style.display = "block";

        document.body.appendChild(this.renderer.view);

        loader.add(opts.files).load(this.setup.bind(this));

        this.socket = opts.socket;
        this.playerProps.name = opts.userName;

        this.loop();

    },
    setup: function () {
        this.gameScene = new Container();
        this.stage.addChild(this.gameScene);
        this.stage.interactive = true;
        this.stage.interactiveChildren = true;
        UTILS = new Utils();
        this.initHealthBar();
        this.initPlayer();
        this.keyboardEvent();
        this.socketEvent();
    },
    initHealthBar: function () {

        this.healthBar.textStr = new Text("HEALTH:"/*UTILS.healthText(this.playerProps.health)*/, UTILS.style);
        this.healthBar.textStr.x = 10;
        this.healthBar.textStr.y = 10;
        this.gameScene.addChild(this.healthBar.textStr);

        this.healthBar.group = new Container();
        this.healthBar.group.position.set(120, 13);
        this.gameScene.addChild(this.healthBar.group);


        let innerBar = new Graphics();
        innerBar.beginFill(0x000000);
        innerBar.drawRect(0, 0, 100, 16);
        innerBar.endFill();
        this.healthBar.group.addChild(innerBar);

        let outerBar = new Graphics();
        outerBar.beginFill(0x5FB404);
        outerBar.drawRect(0, 0, 100, 16);
        outerBar.endFill();
        this.healthBar.group.addChild(outerBar);

        this.healthBar.outer = outerBar;

    },
    initPlayer: function () {

        this.player = new AnimatedSprite(UTILS.frames.character.idle);
        this.player.x = window.innerWidth / 2 - this.player.width / 2;
        this.player.y = window.innerHeight / 2 - this.player.height / 2;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.anchor.set(0.5);
        this.player.animationSpeed = 0.5;
        this.player.play();
        this.player.scale.set(0.2);
        this.gameScene.addChild(this.player);

        this.playerProps.playerName = new Text(this.playerProps.name, UTILS.style);
        this.gameScene.addChild(this.playerProps.playerName);

        //set game started state
        this.started = true;

    },
    socketEvent: function () {

        //connect to server with username param
        this.socket = io.connect('', {query: 'name=' + this.playerProps.name})

        let _this = this;

        this.socket.on("otherprojectile", function (proj) {

            let graphics = new Sprite(resources["images/bullet.png"].texture);
            graphics.x = proj.x;
            graphics.y = proj.y;
            graphics.anchor.set(0.5);
            graphics.scale.set(0.1);
            graphics.vx = proj.vx;
            graphics.vy = proj.vy;
            graphics.rotation = proj.rot;
            graphics.playerId = proj.playerId;
            graphics.weaponType = proj.weaponType;

            _this.projectiles.push(graphics);
            _this.gameScene.addChild(graphics);
        });

        this.socket.on("leaveplayer", function (id) {
            _this.removeOtherPlayerFromStageById(id);
        });

        this.socket.on("moved", function (clients) {
            for (let i in clients) {

                if (i == _this.socket.id) continue;

                _this.otherPlayers[i].player.x = clients[i].x;
                _this.otherPlayers[i].player.y = clients[i].y;
                _this.otherPlayers[i].player.rotation = clients[i].rot;
                _this.otherPlayers[i].name.x = clients[i].name.x;
                _this.otherPlayers[i].name.y = clients[i].name.y;
                _this.otherPlayers[i].healthBarGroup.x = clients[i].x - 25;
                _this.otherPlayers[i].healthBarGroup.y = clients[i].y + 30;
            }
        });

        this.socket.on("onhit", function(data){
            if(_this.otherPlayers[data.clientId]){
                let miniHealthBarDivider = 2;
                _this.otherPlayers[data.clientId].health -= Weapon[data.weaponType].damage/miniHealthBarDivider;
                _this.otherPlayers[data.clientId].healthBarGroup.outer.width -= Weapon[data.weaponType].damage/miniHealthBarDivider;
            }
        });

        this.socket.on("newplayer", function (clients) {

            if (UTILS.isEmpty(clients)) return;

            if (clients) {
                for (let i in clients) {

                    // same client id or other player is rendered
                    if (i == _this.socket.id || _this.otherPlayers[i] != undefined) continue;

                    _this.otherPlayers[i] = {};
                    _this.otherPlayers[i].health = 100;

                    let healthBarGroup = new Container();
                    healthBarGroup.position.set(clients[i].x - 25, clients[i].y + 30);
                    _this.gameScene.addChild(healthBarGroup);


                    let innerBar = new Graphics();
                    innerBar.beginFill(0x000000);
                    innerBar.drawRect(0, 0, 50, 8);
                    innerBar.endFill();
                    healthBarGroup.addChild(innerBar);

                    let outerBar = new Graphics();
                    outerBar.beginFill(0x5FB404);
                    outerBar.drawRect(0, 0, 50, 8);
                    outerBar.endFill();
                    healthBarGroup.addChild(outerBar);

                    healthBarGroup.outer = outerBar;

                    _this.otherPlayers[i].healthBarGroup = healthBarGroup;

                    let player = new AnimatedSprite(UTILS.frames.character.idle);
                    player.x = clients[i].x;
                    player.y = clients[i].y;
                    player.anchor.set(0.5);
                    player.scale.set(0.2);
                    player.animationSpeed = 0.5;
                    player.rotation = 0;
                    player.play();
                    _this.otherPlayers[i].player = player;
                    _this.gameScene.addChild(player);

                    _this.otherPlayers[i].name = new Text(clients[i].name.str, UTILS.style);
                    _this.otherPlayers[i].name.x = clients[i].name.x;
                    _this.otherPlayers[i].name.y = clients[i].name.y;

                    _this.gameScene.addChild(_this.otherPlayers[i].name);

                }
            }
        });

    },
    removeOtherPlayerFromStageById: function(_id){
        this.gameScene.removeChild(this.otherPlayers[_id].player);
        this.gameScene.removeChild(this.otherPlayers[_id].name);
        this.gameScene.removeChild(this.otherPlayers[_id].healthBarGroup);
        delete this.otherPlayers[_id];
    },
    fire: function (_rotation) {

        let now = new Date();
        if (now - this.playerProps.lastShootTime < this.playerProps.weapon.fireRate) return;
        this.playerProps.lastShootTime = now;

        this.player.textures = UTILS.frames.character.shoot;
        this.player.animationSpeed = 0.2;
        setTimeout(function(){
            this.player.textures = UTILS.frames.character.idle;
            this.player.animationSpeed = 0.5;
        }.bind(this),100);

        let targetX = this.renderer.plugins.interaction.mouse.global.x + 16 - this.player.x;
        let targetY = this.renderer.plugins.interaction.mouse.global.y + 16 - this.player.y;

        let mag = Math.sqrt(targetX * targetX + targetY * targetY);

        let velocityInstance = {x: 0, y: 0};

        velocityInstance.x = (targetX / mag) * 25;
        velocityInstance.y = (targetY / mag) * 25;

        let graphics = new Sprite(resources["images/bullet.png"].texture);
        graphics.x = this.player.x;
        graphics.y = this.player.y;
        graphics.anchor.set(0.5);
        graphics.scale.set(0.1);
        graphics.vx = velocityInstance.x;
        graphics.vy = velocityInstance.y;
        graphics.rotation = _rotation;
        graphics.playerId = this.socket.id;
        graphics.weaponType = this.playerProps.weapon.type;


        this.socket.emit("projectile", {
            x: this.player.x,
            y: this.player.y,
            vx: velocityInstance.x,
            vy: velocityInstance.y,
            rot: _rotation,
            playerId: this.socket.id,
            weaponType: this.playerProps.weapon.type
        });

        this.projectiles.push(graphics);
        this.gameScene.addChild(graphics);

    },
    isPlayerDead: function(_projectiles){
        /*Weapon[_projectile.weaponType].damage*/
        if( this.playerProps.health - this.playerProps.weapon.damage <= 0){
            return true;
        }
        return false;
    },
    keyboardEvent: function () {

        this.keys.left = UTILS.keyboard(65);
        this.keys.up = UTILS.keyboard(87);
        this.keys.right = UTILS.keyboard(68);
        this.keys.down = UTILS.keyboard(83);
        this.keys.space = UTILS.keyboard(32);

    },
    update: function () {

        let _this = this;

        if (!this.started) return;

        this.player.vy = 0;
        this.player.vx = 0;

        if (this.keys.down.isDown) {
            this.player.vy += this.playerProps.speed;
        }

        if (this.keys.up.isDown) {
            this.player.vy -= this.playerProps.speed;
        }

        if (this.keys.left.isDown) {
            this.player.vx -= this.playerProps.speed;
        }

        if (this.keys.right.isDown) {
            this.player.vx += this.playerProps.speed;
        }

        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        this.playerProps.playerName.x = this.player.x - this.playerProps.playerName.width / 2;
        this.playerProps.playerName.y = this.player.y - 50;

        this.player.rotation = UTILS.rotateToPoint(
            this.renderer.plugins.interaction.mouse.global.x,
            this.renderer.plugins.interaction.mouse.global.y,
            this.player.x, this.player.y);

        if (this.keys.space.isDown) {
            this.fire(this.player.rotation);
        }

        for (let i = 0; i < this.projectiles.length; i++) {

            //set projectiles coordinates
            this.projectiles[i].x += this.projectiles[i].vx;
            this.projectiles[i].y += this.projectiles[i].vy;

            let errorMargin = 20;

            let otherPlayerIds = Object.keys(this.otherPlayers);

            //check other players hit collisions
            for (let j = 0; j < otherPlayerIds.length; j++) {
                if (UTILS.hitTestRectangle(this.projectiles[i], this.otherPlayers[otherPlayerIds[j]].player)) {
                    if (this.projectiles[i].playerId == otherPlayerIds[j]) continue;
                    this.socket.emit("hit",{
                        clientId : otherPlayerIds[j],
                        weaponType : _this.projectiles[i].weaponType
                    });
                    this.otherPlayers[otherPlayerIds[j]].player.alpha = 0.5;
                    this.gameScene.removeChild(this.projectiles[i]);
                    this.projectiles.splice(i, 1);
                    setTimeout(function () {
                        this.otherPlayers[otherPlayerIds[j]].player.alpha = 1;
                    }.bind(this), 100);

                }
            }


            if(this.projectiles[i]){
                //check the PLAYER collisions to otherPlayers projectiles
                if (this.projectiles[i].playerId != this.socket.id) {
                    if (UTILS.hitTestRectangle(this.projectiles[i], this.player)) {
                        this.player.alpha = 0.5;
                        this.gameScene.removeChild(this.projectiles[i]);
                        this.projectiles.splice(i, 1);
                        if(!this.isPlayerDead()){
                            //TODO change player weapon to other player weapon damage
                            this.playerProps.health -= this.playerProps.weapon.damage;
                            this.healthBar.outer.width =
                                Math.round(this.healthBar.outer.width-this.playerProps.weapon.damage);
                            setTimeout(function () {
                                this.player.alpha = 1;
                            }.bind(this), 100);
                        }
                    }
                }
            }


            if(this.projectiles[i]){
                //check if any projectiles leaves the map remove from canvas
                if (this.projectiles[i].x + errorMargin > window.innerWidth ||
                    this.projectiles[i].x < -errorMargin ||
                    this.projectiles[i].y + errorMargin > window.innerHeight ||
                    this.projectiles[i].y < -errorMargin) {
                    this.gameScene.removeChild(this.projectiles[i]);
                    this.projectiles.splice(i, 1);
                }
            }

        }

        //emit player properties to other players
        if (this.socket) {
            this.socket.emit("move", {
                x: this.player.x,
                y: this.player.y,
                rot: this.player.rotation,
                name: {
                    str: this.playerProps.name,
                    x: this.playerProps.playerName.x,
                    y: this.playerProps.playerName.y
                }
            });
        }

        //set player coordinates within canvas
        UTILS.contain(this.player,
            {
                x: this.player.width / 2, y: this.player.height / 2,
                width: window.innerWidth + this.player.width / 2,
                height: window.innerHeight + this.player.height / 2
            });
    },
    loop: function () {
        requestAnimationFrame(this.loop.bind(this));
        this.update();
        this.renderer.render(this.stage);
    }
};

