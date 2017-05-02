let files = [
    "images/character/handgun/idle/survivor-idle_handgun_0.png",
    "images/character/handgun/idle/survivor-idle_handgun_1.png",
    "images/character/handgun/idle/survivor-idle_handgun_2.png",
    "images/character/handgun/idle/survivor-idle_handgun_3.png",
    "images/character/handgun/idle/survivor-idle_handgun_4.png",
    "images/character/handgun/idle/survivor-idle_handgun_5.png",
    "images/character/handgun/idle/survivor-idle_handgun_6.png",
    "images/character/handgun/idle/survivor-idle_handgun_7.png",
    "images/character/handgun/idle/survivor-idle_handgun_8.png",
    "images/character/handgun/idle/survivor-idle_handgun_9.png",
    "images/character/handgun/idle/survivor-idle_handgun_10.png",
    "images/character/handgun/idle/survivor-idle_handgun_11.png",
    "images/character/handgun/idle/survivor-idle_handgun_12.png",
    "images/character/handgun/idle/survivor-idle_handgun_13.png",
    "images/character/handgun/idle/survivor-idle_handgun_14.png",
    "images/character/handgun/idle/survivor-idle_handgun_15.png",
    "images/character/handgun/idle/survivor-idle_handgun_16.png",
    "images/character/handgun/idle/survivor-idle_handgun_17.png",
    "images/character/handgun/idle/survivor-idle_handgun_18.png",
    "images/character/handgun/idle/survivor-idle_handgun_19.png",
    "images/character/handgun/shoot/survivor-shoot_handgun_0.png",
    "images/character/handgun/shoot/survivor-shoot_handgun_1.png",
    "images/character/handgun/shoot/survivor-shoot_handgun_2.png",
    "images/box.png",
    "images/medkit.png",
    "images/bullet.png"
];


function Utils() {
    this.frames = {
        character: {
            idle: (function () {
                let frames = [];
                for (let i = 0; i <= 19; i++) {
                    frames.push(PIXI.Texture.fromFrame('images/character/handgun/idle/survivor-idle_handgun_' + i + '.png'));
                }
                return frames;
            })(),
            shoot: (function () {
                let frames = [];
                for (let i = 0; i <= 2; i++) {
                    frames.push(PIXI.Texture.fromFrame('images/character/handgun/shoot/survivor-shoot_handgun_' + i + '.png'));
                }
                return frames;
            })()
        }
    };

    this.style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 20,
        fill: "#F5FBEF"
    });
}


Utils.prototype = {
    healthText: function (_health) {
        return "HEALTH:" + _health + "/100";
    },
    keyboard: function (keyCode) {
        let key = {};
        key.code = keyCode;
        key.isDown = false;
        key.isUp = true;
        key.downHandler = function (event) {
            if (event.keyCode === key.code) {
                key.isDown = true;
                key.isUp = false;
            }
            //event.preventDefault();
        };
        key.upHandler = function (event) {
            if (event.keyCode === key.code) {
                key.isDown = false;
                key.isUp = true;
            }
            //event.preventDefault();
        };
        //Attach event listeners
        window.addEventListener(
            "keydown", key.downHandler.bind(key), false
        );
        window.addEventListener(
            "keyup", key.upHandler.bind(key), false
        );
        return key;
    },
    contain: function (sprite, container) {
        let collision = undefined;
        //Left
        if (sprite.x < container.x) {
            sprite.x = container.x;
            collision = "left";
        }
        //Top
        if (sprite.y < container.y) {
            sprite.y = container.y;
            collision = "top";
        }
        //Right
        if (sprite.x + sprite.width > container.width) {
            sprite.x = container.width - sprite.width;
            collision = "right";
        }
        //Bottom
        if (sprite.y + sprite.height > container.height) {
            sprite.y = container.height - sprite.height;
            collision = "bottom";
        }
        //Return the `collision` value
        return collision;
    },
    randomInt: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    getVelocity: function (mouse, player, correction) {

        let targetX = mouse.x + correction - player.x;
        let targetY = mouse.y + correction - player.y;

        let mag = Math.sqrt(targetX * targetX + targetY * targetY);

        return {
            x: (targetX / mag) * 25,
            y: (targetY / mag) * 25
        }
    },
    rotateToPoint: function (mx, my, px, py) {
        let dist_Y = my - py;
        let dist_X = mx - px;
        //var degrees = angle * 180/ Math.PI;
        return Math.atan2(dist_Y, dist_X);
    },
    hitTestRectangle: function (r1, r2) {
        //Define the variables we'll need to calculate
        let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
        //hit will determine whether there's a collision
        hit = false;
        //Find the center points of each sprite
        r1.centerX = r1.x + r1.width / 2;
        r1.centerY = r1.y + r1.height / 2;
        r2.centerX = r2.x + r2.width / 2;
        r2.centerY = r2.y + r2.height / 2;
        //Find the half-widths and half-heights of each sprite
        r1.halfWidth = r1.width / 2;
        r1.halfHeight = r1.height / 2;
        r2.halfWidth = r2.width / 2;
        r2.halfHeight = r2.height / 2;
        //Calculate the distance vector between the sprites
        vx = r1.centerX - r2.centerX;
        vy = r1.centerY - r2.centerY;
        //Figure out the combined half-widths and half-heights
        combinedHalfWidths = r1.halfWidth + r2.halfWidth;
        combinedHalfHeights = r1.halfHeight + r2.halfHeight;
        //Check for a collision on the x axis
        if (Math.abs(vx) < combinedHalfWidths) {
            hit = Math.abs(vy) < combinedHalfHeights;
        } else {
            //There's no collision on the x axis
            hit = false;
        }
        return hit;
    },
    isEmpty: function (obj) {
        let hasOwnProperty = Object.prototype.hasOwnProperty;

        // null and undefined are "empty"
        if (obj == null) return true;

        // Assume if it has a length property with a non-zero value
        // that that property is correct.
        if (obj.length > 0)    return false;
        if (obj.length === 0)  return true;

        // If it isn't an object at this point
        // it is empty, but it can't be anything *but* empty
        // Is it empty?  Depends on your application.
        if (typeof obj !== "object") return true;

        // Otherwise, does it have any properties of its own?
        // Note that this doesn't handle
        // toString and valueOf enumeration bugs in IE < 9
        for (let key in obj) {
            if (hasOwnProperty.call(obj, key)) return false;
        }

        return true;
    }
};
