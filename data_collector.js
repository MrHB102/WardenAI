const mineflayer = require('mineflayer');
const fs = require('fs');
const Vec3 = require('vec3'); // Importando Vec3
const minecraftData = require('minecraft-data'); // Importa a biblioteca

const bot = mineflayer.createBot({
    host: 'localhost',
    version: '1.21.1',
    port: 1111,
    username: 'DataCollectorBot',
    debug: true
});

const mcData = minecraftData(bot.version); // Inicializa mcData com a versão do bot

let gameData = [];

// Função para registrar o estado atual do bot e a ação correspondente
function logAction(action, result = null) {
    const state = {
        position: {
            x: bot.entity.position.x,
            y: bot.entity.position.y,
            z: bot.entity.position.z,
        },
        health: bot.health,
        food: bot.food,
        action: action,
        result: result,
        timestamp: Date.now()
    };

    gameData.push(state);
}

// Salva os dados em intervalos regulares
setInterval(() => {
    if (gameData.length > 0) {
        fs.appendFileSync('game_data.json', JSON.stringify(gameData, null, 2));
        gameData = []; // Limpa os dados após salvar
    }
}, 10000); // Salva a cada 10 segundos

// Função para escolher uma ação aleatória
function getRandomAction() {
    const actions = [
        'move', 'dig', 'place', 'jump', 'run', 'attack', 'eat', 'look', 'interact', 'build', 'swim', 'collect'
    ];
    return actions[Math.floor(Math.random() * actions.length)];
}

function canPlaceBlock(position) {
  const blockBelow = bot.blockAt(position);
  return blockBelow && blockBelow.type !== 0 && !blockBelow.isLiquid; // Verifica se não é ar e não é líquido
}

// Função para executar a ação escolhida
function performRandomAction() {
    if (!bot.entity) return;
    const action = getRandomAction();
    switch (action) {
        case 'move':
            bot.setControlState('forward', true);
            setTimeout(() => {
                bot.setControlState('forward', false);
                logAction('move', 'success');
            }, 1000); // Move por 1 segundo
            break;
        case 'dig':
            const blockToDig = bot.blockAt(bot.entity.position.offset(0, -1, 0));
            bot.dig(blockToDig, (err) => {
                if (err) {
                    console.log('Erro ao cavar:', err);
                    logAction('dig', 'error');
                } else {
                    logAction('dig', 'success');
                }
          });
          break;
          case 'place':
            const itemToPlace = bot.inventory.items().find(item => item.count > 0 && item.type !== mcData.itemsByName.air.id);
            
            if (!itemToPlace) {
                logAction('place', 'no block available');
                console.log('Nenhum bloco disponível para colocar.');
                return;
            }
        
            const itemSlotIndex = bot.inventory.items().indexOf(itemToPlace);
            bot.setQuickBarSlot(itemSlotIndex);
        
            const placePosition = bot.entity.position.offset(0, -1, 0);
            console.log(`Tentando colocar bloco na posição: ${JSON.stringify(placePosition)}`);
        
            const blockBelow = bot.blockAt(placePosition.offset(0, -1, 0));
            console.log(`Tipo de bloco abaixo: ${blockBelow.type}`);
        
            if (!canPlaceBlock(placePosition)) {
                logAction('place', 'invalid placement position');
                console.log(`Posição inválida para colocar bloco: ${JSON.stringify(placePosition)}`);
                return;
            }
        
            bot.placeBlock(blockBelow, new Vec3(0, -1, 0), { timeout: 20000 }, (err) => {
                if (err) {
                    console.error(`Erro ao colocar o bloco na posição ${JSON.stringify(placePosition)}:`, err);
                    logAction('place', 'error placing block');
                } else {
                    logAction('place', 'success');
                    console.log(`Bloco colocado com sucesso na posição ${JSON.stringify(placePosition)}.`);
                }
            });
        
        case 'jump':
            bot.setControlState('jump', true);
            setTimeout(() => {
                bot.setControlState('jump', false);
                logAction('jump', 'success');
            }, 500);
            break;
        case 'run':
            bot.setControlState('sprint', true);
            setTimeout(() => {
                bot.setControlState('sprint', false);
                logAction('run', 'success');
            }, 2000); // Corre por 2 segundos
            break;
        case 'attack':
            const mob = bot.nearestEntity(entity => entity.type === 'mob');
            if (mob) {
                bot.attack(mob, (err) => {
                    if (err) {
                        console.log('Erro ao atacar:', err);
                        logAction('attack', 'error');
                    } else {
                        logAction('attack', 'success');
                    }
                });
            } else {
                logAction('attack', 'no mob');
            }
            break;
        case 'eat':
            const foodItem = bot.inventory.findInventoryItem(mcData.itemsByName.cooked_beef.id, null);
            if (foodItem) {
                bot.eat((err) => {
                    if (err) {
                        console.log('Erro ao comer:', err);
                        logAction('eat', 'error');
                    } else {
                        logAction('eat', 'success');
                    }
                });
            } else {
                logAction('eat', 'no food');
            }
            break;
        case 'look':
            const yaw = Math.random() * Math.PI * 2; // Gira aleatoriamente
            const pitch = Math.random() * Math.PI / 2 - Math.PI / 4; // Olhar para cima ou para baixo
            bot.look(yaw, pitch, true);
            logAction('look', 'success');
            break;
        case 'interact':
            const door = bot.blockAt(bot.entity.position.offset(1, 0, 0)); // Bloco à frente
            if (door && door.type === 'minecraft:wooden_door') {
                bot.open(door, (err) => {
                    if (err) {
                        console.log('Erro ao interagir:', err);
                        logAction('interact', 'error');
                    } else {
                        logAction('interact', 'success');
                    }
                });
            } else {
                logAction('interact', 'no door');
            }
            break;
        case 'build':
            const buildPos = bot.entity.position.offset(0, -1, 0); // Bloco abaixo
            bot.placeBlock(bot.blockAt(buildPos), new Vec3(0, -1, 0), (err) => {
                if (err) {
                    console.log('Erro ao construir:', err);
                    logAction('build', 'error');
                } else {
                    logAction('build', 'success');
                }
            });
            break;
        case 'swim':
            // O bot pode nadar se estiver na água
            bot.setControlState('sprint', true);
            bot.setControlState('forward', true);
            setTimeout(() => {
                bot.setControlState('sprint', false);
                bot.setControlState('forward', false);
                logAction('swim', 'success');
            }, 2000); // Nada por 2 segundos
            break;
        case 'collect':
            const item = bot.nearestEntity(entity => entity.type === 'item'); // Encontra o item mais próximo
            if (item) {
                bot.collectBlock(item, (err) => {
                    if (err) {
                        console.log('Erro ao coletar item:', err);
                        logAction('collect', 'error');
                    } else {
                        logAction('collect', 'success');
                    }
                });
            } else {
                logAction('collect', 'no item');
            }
            break;
    }
}

bot.on('spawn', () => {
    console.log('Bot de coleta de dados iniciado.');
    setInterval(() => {
        performRandomAction();
    }, 5000);
});

bot.on('death', () => {
    if (gameData.length > 0) {
        fs.appendFileSync('game_data.json', JSON.stringify(gameData, null, 2));
        gameData = [];
    }
    console.log('Dados salvos na morte!');
});
