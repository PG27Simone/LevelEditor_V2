var canvas = document.getElementById("game-canvas");
var ctx = canvas.getContext("2d");

//getting font for canvas
var myFont = new FontFace('myFont', 'url(PressStart2P-Regular.ttf)');

myFont.load().then(function(font){

    // with canvas, if this is ommited won't work
    document.fonts.add(font);
    console.log('Font loaded');
  
});

function resizeCanvas() {
    canvas.width = window.innerWidth - 300;
    canvas.height = window.innerHeight - document.querySelector("header").offsetHeight - document.querySelector("footer").offsetHeight - 100;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

var pl = planck;

var world = new pl.World({
    gravity: pl.Vec2(0, -10)
});

var timeStep = 1 / 60;
var velocityIterations = 8;
var positionIterations = 3;

var scale = 30; ///change hits into something related to width and height

var levels = [];
var pigs = [];
var boxes = [];
var boxes2 = [];

var pigu = [];
var boxy = [];
var boxy2 = [];


var isLevelComplete = false;
var currentLevel = 0;
var score = 0;
var birdsRemaining = 3;
var bird;
var birdLaunched = false;


//this is just a mockup of the backend
function loadLevels() {

    setTimeout(() => {

        for(var i = 1; i < $("#level-list option").length; i++){

        const levelId = $("#level-list option").eq(i).text();
        console.log(levelId)

    

            $.ajax({
                url: `http://localhost:3000/level/` + encodeURIComponent(levelId),
                method: "GET",
                contentType: "application/json",
                success: function (response) {

                    const parsedData = JSON.parse(response);

                    for (let i = 0; i < parsedData.length; i++) {

                        const newType = parsedData[i]["type"];
                        const newY = parsedData[i]["y"];
                        const newX = parsedData[i]["x"];

                        if(newType == "block2")
                        {
                            boxy2.push({x: newX/20 - 10, y: newY/50 - 5})
                        }
                        if(newType == "block")
                        {
                            boxy.push({x: newX/20 - 10, y: newY/50 - 5})
                        }
                        if(newType == "pigs"){
                            pigu.push({x: newX/20 - 10, y: newY/50 - 5})
                        }
                        
                    }

                    levels.push({ boxes: boxy, pigs: pigu, boxes2: boxy2 });
                    console.log(levels[0]);
                    pigu = [];
                    boxy = [];
                    boxy2 = [];
                },
                error: function (xhr, status, error) {
                    alert("Error loading level" + xhr.responseText);
                }
            });

        }
    }, 1000);

    /*
    
    levels = [
        //level 1
        {

            pigs: [{ x: 2, y: 1 }],
            boxes: [
                { x: 15, y: 1},
                { x: 17, y: 1},
                { x: 16, y: 3},
            ]
        },

        //level 2
        {
            pigs: [
                { x: 22, y: 1 },
                { x: 24, y: 1 },
            ],
            boxes: [
                { x: 20, y: 1},
                { x: 22, y: 1},
                { x: 24, y: 1},
                { x: 21, y: 3},
                { x: 23, y: 3},
            ]
        }
        
    ];
    */
}

var ground = world.createBody();
//ficture is mesh renderer
ground.createFixture(
    pl.Edge(pl.Vec2(-50, 0), pl.Vec2(50, 0)),
    {
        friction: 0.6
    }
);

function createBox(x, y, dynamic) {
    var bodyDef = {
        position: pl.Vec2(x, y)
    };

    if (dynamic) {
        //adding key to object, changing body type
        bodyDef.type = "dynamic";
    }

    var body = world.createBody(bodyDef);
    body.createFixture(pl.Box(1 / 4, 2 / 4), {
        density: 1.0,
        friction: 0.5,
        //bounciness - higher the bouncier
        restitution: 0.1
    });
    return body;
}


function createPig(x, y) {
    var pigRadius = 0.3;
    var pig = world.createDynamicBody(pl.Vec2(x, y));

    pig.createFixture(pl.Circle(pigRadius), {
        density: 0.5,
        friction: 0.5,
        restitution: 0.5,
        //adding a tag to use later to identify it. custom property
        userData: "pig"
    });
    //another custom property 
    pig.isPig = true;
    return pig;
}

function createBox2(x, y, dynamic) {
    var bodyDef = {
        position: pl.Vec2(x, y)
    };

    if (dynamic) {
        //adding key to object, changing body type
        bodyDef.type = "dynamic";
    }

    var body2 = world.createBody(bodyDef);
    body2.createFixture(pl.Box(1, 1 / 4), {
        density: 1.0,
        friction: 0.5,
        //bounciness - higher the bouncier
        restitution: 0.1
    });
    return body2;
}

//adapt accordingly to the backend code
function initLevel(levelIndex) {
    //grab everything except for ground and destroy it to clear the level
    //as long as b has something it will continue
    for (var b = world.getBodyList(); b; b = b.getNext()) {
        if (b !== ground) {
            world.destroyBody(b);
        }
    }

    //make sure these are empty
    pigs = [];
    boxes = [];
    boxes2 = [];
    isLevelComplete = false;
    birdLaunched = false;
    birdsRemaining = 3;

    var level = levels[levelIndex];

    //going over array and pushing it into game box array
    level.boxes.forEach(function (boxData) {
        boxes.push(createBox(boxData.x, boxData.y, true));
    });

    level.boxes2.forEach(function (boxData) {
        boxes2.push(createBox2(boxData.x, boxData.y, true));
    });

    level.pigs.forEach(function (pigData) {
        pigs.push(createPig(pigData.x, pigData.y));
    });

    createBird();

}

var birdRadius = 0.5;
var birdStartPos = pl.Vec2(5, 5);

function createBird() {
    bird = world.createDynamicBody(birdStartPos);
    bird.createFixture(pl.Circle(birdRadius), {
        density: 1.5,
        friction: 0.5,
        restitution: 0.5,
    });
}

var isMouseDown = false;
var mousePos = pl.Vec2(0, 0);
var launchVector = pl.Vec2(0, 0);

canvas.addEventListener("mousedown", function (event) {
    if (birdsRemaining > 0 && !birdLaunched) {
        //tells us where the canvas is - the properties of the canvas right now
        var rect = canvas.getBoundingClientRect();
        //get X  and Y position of mouse on browser and removing area outside of canvas
        var mouseX = (event.clientX - rect.left) / scale;
        var mouseY = (canvas.height - (event.clientY - rect.top)) / scale;

        //get position is a planck function
        var birdPos = bird.getPosition();
        //pl = box2D?
        var dist = pl.Vec2.distance(birdPos, pl.Vec2(mouseX, mouseY));

        if (dist < birdRadius) {
            isMouseDown = true;
        }
    }
});

canvas.addEventListener("mousemove", function (event) {
    if (isMouseDown) {
        var rect = canvas.getBoundingClientRect();
        var mouseX = (event.clientX - rect.left) / scale;
        var mouseY = (canvas.height - (event.clientY - rect.top)) / scale;
        mousePos = pl.Vec2(mouseX, mouseY);
        launchVector = pl.Vec2.sub(bird.getPosition(), mousePos);
    }
});

canvas.addEventListener("mouseup", function (event) {
    if (isMouseDown) {
        isMouseDown = false;
        bird.setLinearVelocity(pl.Vec2(0, 0));
        //make sure it doesnt start to rotate w/ impulse
        bird.setAngularVelocity(0);
        bird.applyLinearImpulse(launchVector.mul(5), bird.getWorldCenter(), true);

        birdLaunched = true;
        birdsRemaining--;
    }
});

//Physics engine updates

function update() {
    world.step(timeStep, velocityIterations, positionIterations);

    pigs = pigs.filter(function (pig) {
        if (pig.isDestroyed) {
            world.destroyBody(pig);
            score += 100;
            return false;
        }
        return true;
    });

    //if there is 0 pigs and level is not complete
    if (pigs.length === 0 && !isLevelComplete) {
        isLevelComplete = true;

        setTimeout(function () {
            alert("Level complete!")
            nextLevel();
        }, 500); //wait for 500 ms before you do this
    }

    //TODO: definitely improve this
    if (birdLaunched) {
        var birdPos = bird.getPosition();
        //TODO: put better values here for lose condition
        if (birdPos.x > 50 || birdPos.y < -10 || (bird.getLinearVelocity().length() < 0.1 && !isMouseDown)) {
            if (birdsRemaining > 0) {
                createBird();
                birdLaunched = false;
            } else if (!isLevelComplete) {
                setTimeout(function () {
                    alert("Game Over! Try again")
                    resetLevel();
                }, 500); //wait for 500 ms before you do this
            }
        }
    }
}

//called with the pig and the wall and everything that is colliding with each other and pass contact and impulse of the two things
world.on("post-solve", function (contact, impulse) {
    if (!impulse) return;

    //get the two bodies colliding
    var fixtureA = contact.getFixtureA();
    var fixtureB = contact.getFixtureB();
    //get rigid body which contains info
    var bodyA = fixtureA.getBody();
    var bodyB = fixtureB.getBody();

    //check if colliding with ground - if we are forget about it (to not kill the pig)
    function isGround(body) {
        return body === ground;
    }

    //checkinf if either/both are bigs and setting them
    if (bodyA.isPig || bodyB.isPig) {
        var pigBody = bodyA.isPig ? bodyA : bodyB;
        var otherBody = bodyA.isPig ? bodyB : bodyA;

        if (isGround(otherBody)) return;

        //normal impulse perpendicular to surface of collider
        //maybe grabbed more than one impulse so grabbing the first one
        var normalImpulse = impulse.normalImpulses[0];

        //how hard its gonna hit to destroy
        if (normalImpulse > 1.0) {
            pigBody.isDestroyed = true;
        }
    }
});

//rendering
function draw() {
    //clear it
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //draw the line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.strokeStyle = "#004d40";
    ctx.lineWidth = 2;
    ctx.stroke();

    //draw boxes
    boxes.forEach(function (box) {
        var position = box.getPosition();
        var angle = box.getAngle();
        var shape = box.getFixtureList().getShape();
        //getting vertices of box and draw a box with them - good if you want to add smth other than boxes so you can get vertices and draw it
        var vertices = shape.m_vertices;

        ctx.save();

        ctx.translate(position.x * scale, canvas.height - position.y * scale);
        ctx.rotate(-angle);
        ctx.beginPath();
        //get first vertex
        ctx.moveTo(vertices[0].x * scale, -vertices[0].y * scale);
        //go to rest of vertices and draw
        for (var i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x * scale, -vertices[i].y * scale);
        }
        ctx.closePath();
        ctx.fillStyle = "#794448";
        ctx.fill();

        ctx.restore();

    });

    //draw boxes 2
    boxes2.forEach(function (box) {
        var position = box.getPosition();
        var angle = box.getAngle();
        var shape = box.getFixtureList().getShape();
        //getting vertices of box and draw a box with them - good if you want to add smth other than boxes so you can get vertices and draw it
        var vertices = shape.m_vertices;

        ctx.save();

        ctx.translate(position.x * scale, canvas.height - position.y * scale);
        ctx.rotate(-angle);
        ctx.beginPath();
        //get first vertex
        ctx.moveTo(vertices[0].x * scale, -vertices[0].y * scale);
        //go to rest of vertices and draw
        for (var i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x * scale, -vertices[i].y * scale);
        }
        ctx.closePath();
        ctx.fillStyle = "#794448";
        ctx.fill();

        ctx.restore();

    });


    //go through each pig to draw them
    pigs.forEach(function (pig) {
        var pigPos = pig.getPosition();
        var pigRadius = 0.3;
        ctx.beginPath();
        ctx.arc(pigPos.x * scale, canvas.height - pigPos.y * scale, pigRadius * scale, 0, 2 * Math.PI);
        ctx.fillStyle = "#8bc34a";
        ctx.fill();
    });

    //if we have a bird
    if (bird) {
        var birdPos = bird.getPosition();
        ctx.beginPath();
        ctx.arc(birdPos.x * scale, canvas.height - birdPos.y * scale, birdRadius * scale, 0, 2 * Math.PI);
        ctx.fillStyle = "#f44336";
        ctx.fill();
    }

    //line for mouse down
    if (isMouseDown) {
        var birdPos = bird.getPosition();
        ctx.beginPath();
        ctx.moveTo(birdPos.x * scale, canvas.height - birdPos.y * scale);
        ctx.lineTo(mousePos.x * scale, canvas.height - mousePos.y * scale);
        ctx.strokeStyle = "#9e9e9e";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.fillStyle = "#000";
    ctx.font = "16px myFont";
    ctx.fillText("Score: " + score, 10, 20);
    ctx.fillText("Level: " + (currentLevel + 1), 10, 40);
    ctx.fillText("Birds Remaining: " + birdsRemaining, 10, 60);

}

function resetLevel() {
    initLevel(currentLevel);
}

//putting winning condition here but should probably change where it is
function nextLevel() {
    currentLevel++;
    if (currentLevel < levels.length) {
        initLevel(currentLevel)
    } else {
        alert("Congrats, you won!");
        currentLevel = 0;
        score = 0;
        initLevel(currentLevel);
    }
}

function loop() {
    setTimeout(() => {
        update();
    }, 2000);
    draw();
    requestAnimationFrame(loop);
}

//initialize game
loadLevels();
setTimeout(() => {
    initLevel(currentLevel);
}, 2000);
loop();





