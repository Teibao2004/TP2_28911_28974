const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let score1 = 0;
let score2 = 0;
let scoreText1;
let scoreText2;
let timerText;
let gameTime = 180; // Tempo de jogo em segundos (3 minutos)
let gameOver = false;
let playAgainKey;
const speedX = 300; // Velocidade ajustada proporcionalmente
const speedY = 480;
const maxPuckSpeed = 600; // Velocidade máxima do disco

function preload() {
    this.load.image('table', 'assets/table.png');
    this.load.image('puck', 'assets/puck.png');
    this.load.image('mallet1', 'assets/mallet1.png');
    this.load.image('mallet2', 'assets/mallet2.png');
}

function create() {
    // Desenhar a mesa de Air Hockey com ângulos de 90 graus
    let graphics = this.add.graphics();
    graphics.fillStyle(0x00bfff, 1); // cor da mesa
    graphics.fillRect(50, 50, 800, 500); // posição e dimensões do campo com cantos de 90 graus

    // Adicionar linha divisória
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.beginPath();
    graphics.moveTo(450, 50);
    graphics.lineTo(450, 550);
    graphics.closePath();
    graphics.strokePath();

    // Adicionar balizas maiores e centradas
    this.leftGoal = this.add.rectangle(40, 300, 10, 200, 0xff0000).setOrigin(0, 0.5);
    this.physics.add.existing(this.leftGoal, true); // Baliza esquerda (estática)
    this.rightGoal = this.add.rectangle(850, 300, 10, 200, 0xff0000).setOrigin(0, 0.5);
    this.physics.add.existing(this.rightGoal, true); // Baliza direita (estática)

    // Adicionar barreiras invisíveis para impedir que a bola saia do campo
    this.barrierLeft = this.add.rectangle(35, 300, 20, 500).setOrigin(0, 0.5);
    this.physics.add.existing(this.barrierLeft, true);
    this.barrierRight = this.add.rectangle(855, 300, 20, 500).setOrigin(0, 0.5);
    this.physics.add.existing(this.barrierRight, true);
    this.barrierTop = this.add.rectangle(450, 45, 820, 10).setOrigin(0.5, 0);
    this.physics.add.existing(this.barrierTop, true);
    this.barrierBottom = this.add.rectangle(450, 555, 820, 10).setOrigin(0.5, 0);
    this.physics.add.existing(this.barrierBottom, true);

    // Adicionar disco e mallets
    this.puck = this.physics.add.image(450, 300, 'puck').setCollideWorldBounds(true).setBounce(0.9, 0.9).setCircle(20);
    this.mallet1 = this.physics.add.image(150, 300, 'mallet1').setCollideWorldBounds(true).setImmovable(true).setCircle(40);
    this.mallet2 = this.physics.add.image(750, 300, 'mallet2').setCollideWorldBounds(true).setImmovable(true).setCircle(40);

    // Adicionar colisões para as barreiras invisíveis
    this.physics.add.collider(this.puck, this.barrierLeft);
    this.physics.add.collider(this.puck, this.barrierRight);
    this.physics.add.collider(this.puck, this.barrierTop);
    this.physics.add.collider(this.puck, this.barrierBottom);

    // Configurar colisões
    this.physics.add.collider(this.puck, this.mallet1, hitMallet, null, this);
    this.physics.add.collider(this.puck, this.mallet2, hitMallet, null, this);
    this.physics.add.overlap(this.puck, this.leftGoal, goal, null, this);
    this.physics.add.overlap(this.puck, this.rightGoal, goal, null, this);

    // Adicionar texto de pontuação
    scoreText1 = this.add.text(16, 16, 'Jogador 1: 0', { fontSize: '32px', fill: '#FFF' });
    scoreText2 = this.add.text(660, 16, 'Jogador 2: 0', { fontSize: '32px', fill: '#FFF' }); // Ajustado para estar visível
    timerText = this.add.text(450, 16, 'Tempo: 180', { fontSize: '32px', fill: '#FFF' }).setOrigin(0.5, 0);

    // Configurar controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    // Configurar tecla para jogar novamente
    playAgainKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Configurar timer
    this.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: this,
        loop: true
    });

    // Ajustar limites personalizados para os jogadores
    this.mallet1.setCollideWorldBounds(true);
    this.mallet1.body.setBoundsRectangle(new Phaser.Geom.Rectangle(50, 50, 400, 500));
    this.mallet2.setCollideWorldBounds(true);
    this.mallet2.body.setBoundsRectangle(new Phaser.Geom.Rectangle(450, 50, 400, 500));
}

function hitMallet(puck, mallet) {
    // Ajustar a velocidade do disco ao colidir com os mallets
    let velocity = puck.body.velocity.clone();
    if (puck.x < 450) {
        // Disco no lado do Jogador 1
        if (velocity.x > 0 && puck.x < mallet.x) {
            // Se o disco estiver a ir para a direita e ainda estiver no lado do Jogador 1, reduzir velocidade
            velocity.scale(0.7);
            puck.body.setVelocity(velocity.x, velocity.y);
        }
    } else {
        // Disco no lado do Jogador 2
        if (velocity.x < 0 && puck.x > mallet.x) {
            // Se o disco estiver a ir para a esquerda e ainda estiver no lado do Jogador 2, reduzir velocidade
            velocity.scale(0.7);
            puck.body.setVelocity(velocity.x, velocity.y);
        }
    }
}

function goal(puck, goal) {
    // Verificar qual baliza foi atingida
    if (goal === this.leftGoal) {
        score2 += 1; // Golo para o jogador 2
        scoreText2.setText('Jogador 2: ' + score2);
    } else {
        score1 += 1; // Golo para o jogador 1
        scoreText1.setText('Jogador 1: ' + score1);
    }

    // Reiniciar a posição do disco
    this.puck.setPosition(450, 300);
    this.puck.setVelocity(0, 0);

    // Verificar se algum jogador atingiu 7 golos
    if (score1 >= 7 || score2 >= 7) {
        gameOver = true;
        displayEndGame(this);
    }
}

function updateTimer() {
    if (!gameOver) {
        gameTime--;
        timerText.setText('Tempo: ' + gameTime);

        if (gameTime <= 0) {
            gameOver = true;
            displayEndGame(this);
        }
    }
}

function displayEndGame(scene) {
    // Exibir placar final
    let endText = `Fim do Jogo\nJogador 1: ${score1}\nJogador 2: ${score2}`;
    let endGameText = scene.add.text(450, 300, endText, { fontSize: '48px', fill: '#FFF', align: 'center' }).setOrigin(0.5);

    // Adicionar instrução para jogar novamente
    let playAgainText = scene.add.text(450, 400, 'Pressiona ESPAÇO para Jogar Novamente', { fontSize: '32px', fill: '#0F0' }).setOrigin(0.5);

    // Parar os jogadores e a bola
    scene.puck.setVelocity(0, 0);
    scene.mallet2.setVelocity(0, 0);

    // Adicionar evento para a tecla ESPAÇO
    playAgainKey.on('down', () => {
        gameOver = false;
        score1 = 0;
        score2 = 0;
        gameTime = 180;
        scoreText1.setText('Jogador 1: 0');
        scoreText2.setText('Jogador 2: 0');
        timerText.setText('Tempo: 180');
        endGameText.destroy();
        playAgainText.destroy();
        scene.puck.setPosition(450, 300);
        scene.mallet1.setPosition(150, 300);
        scene.mallet2.setPosition(750, 300);
    });
}

function update() {
    if (gameOver) return;

    // Limitar a velocidade do disco
    this.puck.body.velocity.x = Phaser.Math.Clamp(this.puck.body.velocity.x, -maxPuckSpeed, maxPuckSpeed);
    this.puck.body.velocity.y = Phaser.Math.Clamp(this.puck.body.velocity.y, -maxPuckSpeed, maxPuckSpeed);

    // Controles do jogador 1 (WASD)
    if (this.wasd.left.isDown) {
        this.mallet1.setVelocityX(-speedX);
    } else if (this.wasd.right.isDown) {
        this.mallet1.setVelocityX(speedX);
    } else {
        this.mallet1.setVelocityX(0);
    }

    if (this.wasd.up.isDown) {
        this.mallet1.setVelocityY(-speedY);
    } else if (this.wasd.down.isDown) {
        this.mallet1.setVelocityY(speedY);
    } else {
        this.mallet1.setVelocityY(0);
    }

    // Controles do jogador 2 (Setas)
    if (this.cursors.left.isDown) {
        this.mallet2.setVelocityX(-speedX);
    } else if (this.cursors.right.isDown) {
        this.mallet2.setVelocityX(speedX);
    } else {
        this.mallet2.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
        this.mallet2.setVelocityY(-speedY);
    } else if (this.cursors.down.isDown) {
        this.mallet2.setVelocityY(speedY);
    } else {
        this.mallet2.setVelocityY(0);
    }
}