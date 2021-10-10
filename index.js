const { Engine,
    Render,
    Runner,
    World,
    Bodies,
    Body, // the ball
    Events // detects Win!
} = Matter;

const cellsHorizontal = 9;
const cellsVertical = 6;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0; // No gravity
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width: width,
        height: height
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);



//Walls
const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true}),
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true}),
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true}),
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true})
];
World.add(world, walls)

//Maze generation
const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);

        counter--;
        
        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;
};

const grid = Array(cellsVertical)
.fill(null)//rows
.map(() => Array(cellsHorizontal).fill(false));//columns

const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));   

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
    // If i have visited the cell at [row, column], then return
    if (grid[row][column]) {
        return;
    }
    // Mark this cell as being visited
    grid[row][column] = true;
    // Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
         [row -1, column, 'up'], // top
         [row, column + 1, 'right'], // right
         [row + 1, column, 'down'] , // bottom
         [row, column - 1, 'left'] // left
     ]);
    // For each neighborr....
    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor;

    // See if that neighbor is out of bounds
    if (
        nextRow < 0 || 
        nextRow >= cellsVertical || 
        nextColumn < 0 || 
        nextColumn >= cellsHorizontal
        ) {
    continue;
    }
    // If we have visited that neighbor, continue toi next neighbor
    if (grid[nextRow][nextColumn]) {
        continue;
    }
    // Remove a wall from either horizontals or verticals
    if (direction === 'left') {
        verticals[row][column - 1] = true;
    }   else if (direction === 'right') {
        verticals[row][column] = true;
    }   else if (direction === 'up') {
        horizontals[row - 1][column] = true;
    }   else if (direction === 'down') {
        horizontals[row][column] = true;
    }

    stepThroughCell(nextRow, nextColumn);
    }
    // Visit that next cell
};
stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2, // position x axis
            rowIndex * unitLengthY + unitLengthY, // position y axis
            unitLengthX + 5, // how long the horizontal
            5,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'gray'
                }
            }
            );
    World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX, // position x axis
            rowIndex * unitLengthY + unitLengthY / 2, // position y axis
            5, // how long the horizontal
            unitLengthY + 5,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'gray'
                }
            }
            );
    World.add(world, wall);
    });
});

// Goal

const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * .7,
    unitLengthY * .7,
    {
        label: 'goal',
        isStatic : true,
        render: {
            fillStyle: 'green'
        }
    }
);
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY)  / 4
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius,
    {
        label: 'ball',
        render: {
            fillStyle: 'blue'
        }
    }
);
World.add(world, ball);

document.addEventListener('keydown', event => {
    const { x, y } = ball.velocity;
    if (event.keyCode === 87) { // UP
        Body.setVelocity(ball, { x, y: y - 1.5});
    }
    if (event.keyCode === 68) { // Right
        Body.setVelocity(ball, { x: x + 1.5, y });
    }
    if (event.keyCode === 83) { // Down
        Body.setVelocity(ball, { x, y: y + 1.5});
    }
    if (event.keyCode === 65) { // Left
        Body.setVelocity(ball, { x: x - 1.5, y });
    }
});

// Win Condition

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];

        if (
            labels.includes(collision.bodyA.label) &&
            labels.includes(collision.bodyB.label)
        ) {
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            })
        }

    })
});