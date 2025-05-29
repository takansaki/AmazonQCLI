document.addEventListener('DOMContentLoaded', () => {
    // DOM要素
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const congratulationScreen = document.getElementById('congratulation-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const congratulationRestartButton = document.getElementById('congratulation-restart-button');
    const cardContainer = document.getElementById('card-container');
    const timeLeftSpan = document.getElementById('time-left');
    const mistakeCountSpan = document.getElementById('mistake-count');
    const gameOverMessage = document.getElementById('game-over-message');
    
    // 音声要素
    const bgm = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=happy-day-113985.mp3');
    bgm.loop = true;
    bgm.volume = 0.4;
    
    // 効果音
    const matchSound = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3');
    matchSound.volume = 0.6;
    
    const missSound = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_c8634f1e26.mp3?filename=negative_beeps-6008.mp3');
    missSound.volume = 0.6;
    
    // クリア効果音
    const congratulationSound = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_10f75202e7.mp3?filename=success-fanfare-trumpets-6185.mp3');
    congratulationSound.volume = 0.7;
    
    // 音声の初期化（ブラウザの自動再生制限対策）
    let audioInitialized = false;
    
    function initializeAudio() {
        if (audioInitialized) return;
        
        // すべての音声を一度ロードして準備
        bgm.load();
        matchSound.load();
        missSound.load();
        congratulationSound.load();
        
        // 無音の再生を試みることでオーディオコンテキストをアクティブ化
        bgm.volume = 0;
        bgm.play().then(() => {
            bgm.pause();
            bgm.currentTime = 0;
            bgm.volume = 0.4;
            audioInitialized = true;
        }).catch(error => {
            console.log("オーディオの初期化に失敗:", error);
            // 初期化失敗時のメッセージ表示
            showAudioMessage();
        });
    }
    
    function showAudioMessage() {
        const audioMessage = document.createElement('div');
        audioMessage.id = 'audio-message';
        audioMessage.innerHTML = '🔊 音楽と効果音を有効にするには画面をクリックしてください';
        audioMessage.style.position = 'fixed';
        audioMessage.style.top = '10px';
        audioMessage.style.left = '50%';
        audioMessage.style.transform = 'translateX(-50%)';
        audioMessage.style.backgroundColor = 'rgba(255, 153, 0, 0.9)';
        audioMessage.style.color = '#232f3e';
        audioMessage.style.padding = '10px 20px';
        audioMessage.style.borderRadius = '5px';
        audioMessage.style.zIndex = '1000';
        audioMessage.style.cursor = 'pointer';
        audioMessage.style.fontWeight = 'bold';
        document.body.appendChild(audioMessage);
        
        audioMessage.addEventListener('click', function() {
            initializeAudio();
            if (gameScreen.classList.contains('hidden') === false) {
                bgm.play();
            }
            audioMessage.remove();
        });
    }
    
    // ユーザーインタラクションを検出して音声を初期化
    document.addEventListener('click', function initialClick() {
        initializeAudio();
        document.removeEventListener('click', initialClick);
    }, { once: true });
    
    // ページ読み込み時に音声メッセージを表示
    window.addEventListener('load', () => {
        setTimeout(showAudioMessage, 1000);
    });

    // ゲーム状態
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let mistakeCount = 0;
    let timeLeft = 60;
    let timer;
    let canFlip = true;

    // AWSサービスアイコン（10種類のペア）- ローカルアイコン
    const awsIcons = [
        { 
            name: 'EC2', 
            url: 'aws_icons_new/EC2.png',
            fallbackUrl: 'aws_icons/ec2.png'
        },
        { 
            name: 'Lambda', 
            url: 'aws_icons_new/Lambda.png',
            fallbackUrl: 'aws_icons/lambda.png'
        },
        { 
            name: 'DynamoDB', 
            url: 'aws_icons_new/DynamoDB.png',
            fallbackUrl: 'aws_icons/dynamodb.png'
        },
        { 
            name: 'CloudFront', 
            url: 'aws_icons_new/CloudFront.png',
            fallbackUrl: 'aws_icons/cloudfront.png'
        },
        { 
            name: 'Aurora', 
            url: 'aws_icons_new/Aurora.png',
            fallbackUrl: 'aws_icons/rds.png'
        },
        { 
            name: 'SNS', 
            url: 'aws_icons_new/SNS.png',
            fallbackUrl: 'aws_icons/sns.png'
        },
        { 
            name: 'SQS', 
            url: 'aws_icons_new/SQS.png',
            fallbackUrl: 'aws_icons/sqs.png'
        },
        { 
            name: 'Route 53', 
            url: 'aws_icons_new/Route53.png',
            fallbackUrl: 'aws_icons/route53.png'
        },
        { 
            name: 'Amazon Q', 
            url: 'aws_icons_new/AmazonQ.png',
            fallbackUrl: 'aws_icons/iam.png'
        },
        { 
            name: 'Bedrock', 
            url: 'aws_icons_new/Bedrock.png',
            fallbackUrl: 'aws_icons/aws_logo.png'
        }
    ];

    // ゲーム開始
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    congratulationRestartButton.addEventListener('click', startGame);

    function startGame() {
        // 画面切り替え
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        congratulationScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        // BGM再生
        if (audioInitialized) {
            bgm.currentTime = 0;
            bgm.play().catch(e => console.log("BGM再生エラー:", e));
        } else {
            initializeAudio();
            setTimeout(() => {
                bgm.play().catch(e => console.log("BGM再生エラー:", e));
            }, 500);
        }

        // ゲーム状態リセット
        cards = [];
        flippedCards = [];
        matchedPairs = 0;
        mistakeCount = 0;
        timeLeft = 60;
        canFlip = true;
        
        // UI更新
        timeLeftSpan.textContent = timeLeft;
        mistakeCountSpan.textContent = mistakeCount;
        
        // カード生成
        createCards();
        
        // タイマー開始
        clearInterval(timer);
        timer = setInterval(() => {
            timeLeft--;
            timeLeftSpan.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                endGame('時間切れ！');
            }
        }, 1000);
    }

    function createCards() {
        // カードコンテナをクリア
        cardContainer.innerHTML = '';
        
        // カードデータを作成（各アイコンのペア）
        let cardData = [];
        awsIcons.forEach(icon => {
            // 各アイコンを2枚ずつ追加
            cardData.push({ ...icon });
            cardData.push({ ...icon });
        });
        
        // カードをシャッフル
        cardData = shuffleArray(cardData);
        
        // カードを生成して表示
        cardData.forEach((data, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.index = index;
            
            // 画像のプリロードを行う
            const preloadImg = new Image();
            preloadImg.src = data.url;
            preloadImg.onerror = function() {
                preloadImg.src = data.fallbackUrl || 'https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png';
            };
            
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-face card-back"></div>
                    <div class="card-face card-front">
                        <img src="${data.url}" alt="${data.name}" onerror="this.onerror=null; this.src='${data.fallbackUrl || 'https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png'}';">
                        <div class="service-name">${data.name}</div>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => flipCard(card, data));
            cardContainer.appendChild(card);
            cards.push({ element: card, data: data });
        });
    }

    function flipCard(card, cardData) {
        // すでに裏返されているか、一致したカードの場合は何もしない
        if (card.classList.contains('flipped') || !canFlip || card.classList.contains('matched')) {
            return;
        }
        
        // カードを裏返す
        card.classList.add('flipped');
        flippedCards.push({ element: card, data: cardData });
        
        // 2枚めくられた場合
        if (flippedCards.length === 2) {
            canFlip = false;
            
            // カードが一致するか確認
            if (flippedCards[0].data.name === flippedCards[1].data.name) {
                // 一致した場合
                setTimeout(() => {
                    // OK効果音を再生
                    if (audioInitialized) {
                        matchSound.currentTime = 0;
                        matchSound.play().catch(e => console.log("効果音再生エラー:", e));
                    }
                    
                    flippedCards.forEach(card => {
                        card.element.classList.add('matched');
                        card.element.style.visibility = 'hidden';
                    });
                    
                    matchedPairs++;
                    
                    // すべてのペアが見つかった場合
                    if (matchedPairs === awsIcons.length) {
                        showCongratulation();
                    }
                    
                    flippedCards = [];
                    canFlip = true;
                }, 500);
            } else {
                // 一致しない場合
                setTimeout(() => {
                    // NG効果音を再生
                    if (audioInitialized) {
                        missSound.currentTime = 0;
                        missSound.play().catch(e => console.log("効果音再生エラー:", e));
                    }
                    
                    flippedCards.forEach(card => {
                        card.element.classList.remove('flipped');
                    });
                    
                    mistakeCount++;
                    mistakeCountSpan.textContent = mistakeCount;
                    
                    // 10回失敗した場合
                    if (mistakeCount >= 10) {
                        endGame('10回ミスしました！');
                    }
                    
                    flippedCards = [];
                    canFlip = true;
                }, 1000);
            }
        }
    }

    function endGame(message) {
        clearInterval(timer);
        bgm.pause();
        bgm.currentTime = 0;
        gameScreen.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        gameOverMessage.textContent = message;
    }

    // クリア画面表示
    function showCongratulation() {
        clearInterval(timer);
        
        // BGMを一時停止して、クリア効果音を再生
        bgm.pause();
        bgm.currentTime = 0;
        
        // クリア効果音を再生
        if (audioInitialized) {
            congratulationSound.currentTime = 0;
            congratulationSound.play().catch(e => console.log("効果音再生エラー:", e));
        }
        
        gameScreen.classList.add('hidden');
        congratulationScreen.classList.remove('hidden');
        
        // 紙吹雪アニメーションを作成
        createConfetti();
    }
    
    // 紙吹雪アニメーションを作成
    function createConfetti() {
        const confettiContainer = document.querySelector('.confetti-container');
        confettiContainer.innerHTML = '';
        
        const colors = ['#ff9900', '#232f3e', '#ffffff', '#ec7211', '#1dc7b6'];
        
        // 紙吹雪の数
        const confettiCount = 150;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // ランダムな位置、サイズ、色、形を設定
            const size = Math.random() * 10 + 5;
            const left = Math.random() * 100;
            const delay = Math.random() * 3;
            const duration = Math.random() * 3 + 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const shape = Math.random() > 0.5 ? '50%' : '0';
            
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.left = `${left}%`;
            confetti.style.backgroundColor = color;
            confetti.style.borderRadius = shape;
            confetti.style.animationDuration = `${duration}s`;
            confetti.style.animationDelay = `${delay}s`;
            
            confettiContainer.appendChild(confetti);
        }
    }

    // 配列をシャッフルする関数
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
});
