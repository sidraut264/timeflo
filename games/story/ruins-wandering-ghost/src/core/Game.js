const Game = {
    structures: [],
    quests: [],
    updaters: [],
    interactions: [],
    memories: [],

    questIndex: 0,

    input: {
        x: 0,
        z: 0
    },

    keys: {}
};

Game.state = {
    memorySenseActive: false,
    memorySenseTimer: 0,
    memorySenseDuration: 5 // duration in seconds
};

Game.registerStructure = (fn) => {
    Game.structures.push(fn);
};

Game.registerQuest = (q) => {
    Game.quests.push(q);
};

Game.registerUpdate = (fn) => {
    Game.updaters.push(fn);
};

Game.registerInteraction = (interaction) => {
    Game.interactions.push(interaction);
};

Game.registerMemory = (memory) => {
    Game.memories.push(memory);
};

export default Game;
