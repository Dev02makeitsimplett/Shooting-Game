class MainScene extends Phaser.Scene {
   constructor() {
       super("MainScene");
   }


   preload() {
       this.load.image("bullet", "https://labs.phaser.io/assets/sprites/bullet.png");
       this.load.image("player", "https://labs.phaser.io/assets/sprites/phaser-dude.png");
       this.load.image("enemy", "https://labs.phaser.io/assets/sprites/ufo.png");


       // Load questions JSON
       this.load.json("questions", "questions.json");
   }


   create() {
       // Game state
       this.lives = 3;
       this.correctAnswers = 0;
       this.totalToWin = 10;


       // UI (created once)
       this.livesText = this.add.text(20, 20, "Lives: " + this.lives, { fontSize: "24px", fill: "#fff" });
       this.scoreText = this.add.text(650, 20, "Score: " + this.correctAnswers, { fontSize: "24px", fill: "#fff" });


       // Player
       this.player = this.physics.add.sprite(400, 550, "player").setScale(0.5);
       this.player.setCollideWorldBounds(true);


       // Bullets group
       this.bullets = this.physics.add.group();


       // Controls
       this.cursors = this.input.keyboard.createCursorKeys();
       this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);


       // Load & shuffle questions
       this.questions = this.cache.json.get("questions");
       Phaser.Utils.Array.Shuffle(this.questions);


       this.currentQuestionIndex = 0;


       // Question text placeholder
       this.questionText = this.add.text(200, 60, "", {
           fontSize: "22px",
           fill: "#ff0",
           wordWrap: { width: 400 }
       });


       // Enemies group
       this.enemies = this.physics.add.group();
       this.answerTexts = [];


       // Start first wave
       this.showQuestion();
   }


   showQuestion() {
       // Clear old enemies & texts
       this.enemies.clear(true, true);
       this.answerTexts.forEach(t => t.destroy());
       this.answerTexts = [];


       if (this.currentQuestionIndex >= this.questions.length) {
           alert("No more questions!");
           this.scene.restart();
           return;
       }


       // Get next question
       let qData = this.questions[this.currentQuestionIndex];
       this.currentData = qData;


       // Show question immediately
       this.questionText.setText(`Q: ${qData.question}`);


       // Add a 2-second delay before showing choices
       this.time.delayedCall(2000, () => {
           this.spawnAnswers(qData);
       });
   }


   spawnAnswers(qData) {
   // Shuffle choices
   let shuffled = Phaser.Utils.Array.Shuffle(qData.choices);


   // Calculate spacing so choices don’t overlap
   let spacing = 800 / (shuffled.length + 1);
   let enemyScale = 1.5;
   let verticalOffset = 50; // distance from enemy to text


   shuffled.forEach((ans, i) => {
       let x = spacing * (i + 1);


       // Create enemy sprite
       let enemy = this.enemies.create(x, 200, "enemy").setScale(enemyScale);
       enemy.setData("value", ans);


       // Place text ABOVE the enemy
       let ansText = this.add.text(enemy.x, enemy.y - verticalOffset, ans, {
           fontSize: "22px",
           fill: "#fff",
           fontStyle: "bold",
           align: "center",
           wordWrap: { width: enemy.displayWidth + 20 } // ensures long text wraps
       }).setOrigin(0.5, 1); // anchored bottom-center


       enemy.answerText = ansText;
       this.answerTexts.push(ansText);


       enemy.setVelocityY(40);
   });


   // Bullet collision
   this.physics.add.overlap(this.bullets, this.enemies, this.checkAnswer, null, this);
}




   update() {
       // Player movement
       if (this.cursors.left.isDown) {
           this.player.setVelocityX(-200);
       } else if (this.cursors.right.isDown) {
           this.player.setVelocityX(200);
       } else {
           this.player.setVelocityX(0);
       }


       // Shooting
       if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
           this.shoot();
       }


       // Keep text aligned with enemies
       this.enemies.children.iterate(enemy => {
           if (enemy && enemy.answerText) {
               enemy.answerText.x = enemy.x;
               enemy.answerText.y = enemy.y;
               // Enemy reaches bottom → lose life
               if (enemy.y > 580) {
                   this.loseLife(enemy);
               }
           }
       });
   }


   shoot() {
       let bullet = this.bullets.create(this.player.x, this.player.y - 20, "bullet");
       bullet.setVelocityY(-400);
   }


   checkAnswer(bullet, enemy) {
       bullet.destroy();


       if (enemy.getData("value") === this.currentData.answer) {
           this.correctAnswers++;
           this.scoreText.setText("Score: " + this.correctAnswers);


           if (this.correctAnswers >= this.totalToWin) {
               alert("🎉 You Win! You answered 10 correctly!");
               this.scene.restart();
               return;
           }


           this.waveTransition();
       } else {
           this.loseLife(enemy);
       }
   }


   loseLife(enemy) {
       if (enemy) {
           if (enemy.answerText) enemy.answerText.destroy();
           enemy.destroy();
       }


       this.lives--;
       this.livesText.setText("Lives: " + this.lives);


       if (this.lives <= 0) {
           alert("💀 Game Over! Try again.");
           this.scene.restart();
           return;
       }


       this.waveTransition();
   }


   waveTransition() {
       // Destroy remaining enemies & texts
       this.enemies.clear(true, true);
       this.answerTexts.forEach(t => t.destroy());
       this.answerTexts = [];


       // Short pause before next question
       this.time.delayedCall(1000, () => {
           this.currentQuestionIndex++;
           this.showQuestion();
       });
   }
}


let config = {
   type: Phaser.AUTO,
   width: 800,
   height: 600,
   backgroundColor: "#222",
   physics: {
       default: "arcade",
       arcade: { debug: false }
   },
   scene: [MainScene]
};


let game = new Phaser.Game(config);
