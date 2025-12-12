let userScore = 0;
let computerScore = 0;
let provider;
let signer;
let contract;

// ВАЖНО: Замените на ваш адрес контракта после деплоя
const CONTRACT_ADDRESS = "0x92e0DEe33DB8E8e01e9541892E9D66bF99676Ff3";

// ABI контракта (скопируйте из Remix после компиляции)
const CONTRACT_ABI =[
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "enum RockPaperScissors.Choice",
				"name": "playerChoice",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "enum RockPaperScissors.Choice",
				"name": "computerChoice",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "result",
				"type": "string"
			}
		],
		"name": "GamePlayed",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "enum RockPaperScissors.Choice",
				"name": "_playerChoice",
				"type": "uint8"
			}
		],
		"name": "play",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "BET_AMOUNT",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// Элементы DOM
const userScore_span = document.getElementById('user-score');
const computerScore_span = document.getElementById('computer-score');
const result_p = document.querySelector('.result > p');
const rock_div = document.getElementById('r');
const paper_div = document.getElementById('p');
const scissors_div = document.getElementById('s');
const connectBtn = document.getElementById('connectBtn');
const walletAddress = document.getElementById('walletAddress');
const loading = document.getElementById('loading');
const actionMsg = document.getElementById('action-msg');

// Проверка наличия MetaMask
function checkMetaMask() {
    console.log("Checking MetaMask...");
    if (typeof window.ethereum === 'undefined') {
        console.error("MetaMask not found!");
        return false;
    }
    console.log("MetaMask detected:", window.ethereum);
    return true;
}

// Проверка наличия Ethers.js
function checkEthers() {
    console.log("Checking Ethers.js...");
    if (typeof ethers === 'undefined') {
        console.error("Ethers.js not loaded!");
        return false;
    }
    console.log("Ethers.js version:", ethers.version);
    return true;
}

// Подключение кошелька
async function connectWallet() {
    console.log("=== Connect Wallet Started ===");
    
    try {
        // Проверка 1: MetaMask установлен?
        if (!checkMetaMask()) {
            alert("❌ Please install MetaMask!\n\nVisit: https://metamask.io");
            return;
        }

        // Проверка 2: Ethers.js загружен?
        if (!checkEthers()) {
            alert("❌ Ethers.js library not loaded!\n\nPlease refresh the page.");
            return;
        }

        console.log("Requesting accounts...");
        
        // Запрос доступа к аккаунту
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        console.log("Accounts received:", accounts);

        if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found");
        }

        // Создание провайдера
        console.log("Creating provider...");
        provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Получение signer
        console.log("Getting signer...");
        signer = provider.getSigner();
        
        // Получение адреса
        console.log("Getting address...");
        const address = await signer.getAddress();
        console.log("Connected address:", address);

        // Проверка сети
        const network = await provider.getNetwork();
        console.log("Current network:", network);
        
        if (network.chainId !== 97) {
            alert("⚠️ Wrong Network!\n\nPlease switch to BSC Testnet in MetaMask.\n\nChain ID: 97");
            return;
        }

        // Проверка баланса
        const balance = await provider.getBalance(address);
        const balanceInBNB = ethers.utils.formatEther(balance);
        console.log("Balance:", balanceInBNB, "tBNB");

        if (parseFloat(balanceInBNB) < 0.001) {
            alert("⚠️ Low Balance!\n\nYou need at least 0.001 tBNB for gas fees.\n\nGet free tBNB from BSC Testnet Faucet.");
        }

        // Обновление UI
        walletAddress.textContent = `Connected: ${address.slice(0, 6)}...${address.slice(-4)} | Balance: ${parseFloat(balanceInBNB).toFixed(4)} tBNB`;
        connectBtn.textContent = "✓ Connected";
        connectBtn.style.background = "#4CAF50";
        connectBtn.disabled = true;
        actionMsg.textContent = "Make your move!";

        // Инициализация контракта
        if (CONTRACT_ADDRESS !== "YOUR_CONTRACT_ADDRESS_HERE") {
            console.log("Initializing contract...");
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            console.log("Contract initialized:", contract.address);
        } else {
            console.warn("⚠️ Contract address not set! Please deploy contract first.");
            alert("⚠️ Contract not deployed yet!\n\nPlease deploy the smart contract in Remix and update CONTRACT_ADDRESS in app.js");
        }

        console.log("=== Wallet Connected Successfully ===");

    } catch (error) {
        console.error("=== Connection Error ===");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Full error:", error);
        
        let errorMessage = "Failed to connect wallet:\n\n";
        
        if (error.code === 4001) {
            errorMessage += "You rejected the connection request.";
        } else if (error.code === -32002) {
            errorMessage += "Connection request already pending.\nPlease check MetaMask.";
        } else {
            errorMessage += error.message;
        }
        
        alert("❌ " + errorMessage);
    }
}

// Конвертация выбора в число
function choiceToNumber(choice) {
    if (choice === 'r') return 0; // Rock
    if (choice === 'p') return 1; // Paper
    return 2; // Scissors
}

// Конвертация числа в слово
function numberToWord(num) {
    if (num === 0 || num === '0') return "Rock";
    if (num === 1 || num === '1') return "Paper";
    return "Scissors";
}

// Основная игровая функция
async function game(userChoice) {
    console.log("=== Game Started ===");
    console.log("User choice:", userChoice);

    // Проверка подключения кошелька
    if (!contract) {
        alert("⚠️ Please connect your wallet first!");
        return;
    }

    // Проверка адреса контракта
    if (CONTRACT_ADDRESS === "YOUR_CONTRACT_ADDRESS_HERE") {
        alert("⚠️ Contract not deployed!\n\nPlease deploy the smart contract and update CONTRACT_ADDRESS.");
        return;
    }

    try {
        // Показать индикатор загрузки
        loading.style.display = "block";
        result_p.textContent = "🔄 Sending transaction...";
        result_p.className = "";
        
        // Отключить кнопки выбора
        disableChoices();

        // Конвертация выбора
        const playerChoice = choiceToNumber(userChoice);
        console.log("Player choice number:", playerChoice);

        // Сумма ставки
        const betAmount = ethers.utils.parseEther("0.001");
        console.log("Bet amount:", betAmount.toString());

        // Отправка транзакции
        console.log("Sending transaction...");
        const tx = await contract.play(playerChoice, { 
            value: betAmount
        });
        
        console.log("Transaction sent!");
        console.log("TX Hash:", tx.hash);
        
        result_p.textContent = "⏳ Waiting for confirmation...";

        // Ожидание подтверждения
        console.log("Waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("Transaction confirmed!");
        console.log("Receipt:", receipt);

        // Получение результата из события
        const event = receipt.events?.find(e => e.event === 'GamePlayed');
        
        if (!event) {
            throw new Error("GamePlayed event not found in transaction receipt");
        }

        console.log("Event found:", event);
        
        const computerChoice = event.args.computerChoice;
        const result = event.args.result;
        
        console.log("Computer choice:", computerChoice.toString());
        console.log("Result:", result);

        // Обновление UI
        loading.style.display = "none";
        updateResult(userChoice, computerChoice.toString(), result);

        // Обновить баланс
        updateBalance();

    } catch (error) {
        console.error("=== Game Error ===");
        console.error("Error:", error);
        
        loading.style.display = "none";
        result_p.textContent = "❌ Transaction failed!";
        
        let errorMessage = "Transaction failed:\n\n";
        
        if (error.code === 4001) {
            errorMessage += "You rejected the transaction.";
        } else if (error.code === "INSUFFICIENT_FUNDS") {
            errorMessage += "Insufficient funds for gas + bet.";
        } else if (error.message.includes("user rejected")) {
            errorMessage += "You rejected the transaction.";
        } else {
            errorMessage += error.message;
        }
        
        alert("❌ " + errorMessage);
    } finally {
        // Включить кнопки выбора обратно
        enableChoices();
    }

    console.log("=== Game Ended ===");
}

// Обновление результата
function updateResult(userChoice, computerChoice, result) {
    const userWord = numberToWord(choiceToNumber(userChoice));
    const compWord = numberToWord(computerChoice);
    
    if (result === "win") {
        userScore++;
        userScore_span.textContent = userScore;
        result_p.textContent = `${userWord} beats ${compWord}. You win! 🎉`;
        result_p.style.color = "#4CAF50";
    } else if (result === "lose") {
        computerScore++;
        computerScore_span.textContent = computerScore;
        result_p.textContent = `${userWord} loses to ${compWord}. You lost... 😢`;
        result_p.style.color = "#E2584D";
    } else {
        result_p.textContent = `${userWord} equals ${compWord}. It's a draw! 🤝`;
        result_p.style.color = "#FFC107";
    }
}

// Обновить баланс
async function updateBalance() {
    try {
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const balanceInBNB = ethers.utils.formatEther(balance);
        walletAddress.textContent = `Connected: ${address.slice(0, 6)}...${address.slice(-4)} | Balance: ${parseFloat(balanceInBNB).toFixed(4)} tBNB`;
    } catch (error) {
        console.error("Failed to update balance:", error);
    }
}

// Отключить кнопки выбора
function disableChoices() {
    rock_div.style.pointerEvents = "none";
    paper_div.style.pointerEvents = "none";
    scissors_div.style.pointerEvents = "none";
    rock_div.style.opacity = "0.5";
    paper_div.style.opacity = "0.5";
    scissors_div.style.opacity = "0.5";
}

// Включить кнопки выбора
function enableChoices() {
    rock_div.style.pointerEvents = "auto";
    paper_div.style.pointerEvents = "auto";
    scissors_div.style.pointerEvents = "auto";
    rock_div.style.opacity = "1";
    paper_div.style.opacity = "1";
    scissors_div.style.opacity = "1";
}

// Event listeners
connectBtn.addEventListener('click', connectWallet);

rock_div.addEventListener('click', () => game('r'));
paper_div.addEventListener('click', () => game('p'));
scissors_div.addEventListener('click', () => game('s'));

// Автоматическое переподключение при смене аккаунта
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        console.log("Account changed:", accounts);
        if (accounts.length === 0) {
            // Пользователь отключил кошелек
            location.reload();
        } else {
            // Переподключение
            connectWallet();
        }
    });

    window.ethereum.on('chainChanged', (chainId) => {
        console.log("Chain changed:", chainId);
        // Перезагрузить страницу при смене сети
        location.reload();
    });
}

// Проверка при загрузке страницы
window.addEventListener('load', () => {
    console.log("Page loaded");
    console.log("MetaMask available:", typeof window.ethereum !== 'undefined');
    console.log("Ethers.js available:", typeof ethers !== 'undefined');
});