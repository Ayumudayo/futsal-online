const readline = require('readline');

let currentCash = 0;
let pulled_players = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getUserInput(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

function format_value(value) {
    return `₩${value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`;
}

function calculate_player_value(speed, goal_scoring, shot_power, defense, stamina) {
    const value = (speed * 0.2 + goal_scoring * 0.4 + shot_power * 0.3 + defense * 0.1 + stamina * 0.1) * 10000;
    return Math.round(value);  // 원 단위로 반올림
}

function pull_player(name, speed, goalScoring, shotPower, defense, stamina) {
    const value = calculate_player_value(speed, goalScoring, shotPower, defense, stamina);
    const player = {
        id: pulled_players.length + 1,
        name: name,
        speed: speed,
        goalScoring: goalScoring,
        shotPower: shotPower,
        defense: defense,
        stamina: stamina,
        value: value
    };
    pulled_players.push(player);
    return player;
}

function gacha(cashSpent) {
    const pulledPlayers = [];
    const pullCount = Math.floor(cashSpent / 1000); // 1000캐시당 1회 뽑기

    for (let i = 0; i < pullCount; i++) {
        const player = pull_player(
            `Player${Math.floor(Math.random() * 1000)}`,
            Math.floor(Math.random() * 100) + 1,
            Math.floor(Math.random() * 100) + 1,
            Math.floor(Math.random() * 100) + 1,
            Math.floor(Math.random() * 100) + 1,
            Math.floor(Math.random() * 100) + 1
        );
        pulledPlayers.push(player);
    }

    return pulledPlayers;
}

async function chargeCash() {
    while (true) {
        const amount = await getUserInput("충전할 캐시 금액을 입력하세요: ");
        const parsedAmount = parseInt(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            console.log("올바른 금액을 입력해주세요.");
        } else {
            currentCash += parsedAmount;
            console.log(`캐시가 ${parsedAmount}만큼 충전되었습니다.`);
            console.log(`현재 잔액: ${currentCash}`);
            break;
        }
    }
}

async function performGacha() {
    const cashSpent = await getUserInput('사용할 캐시 금액을 입력하세요: ');
    const parsedCashSpent = parseInt(cashSpent);
    
    if (isNaN(parsedCashSpent) || parsedCashSpent <= 0) {
        console.log("올바른 금액을 입력해주세요.");
        return;
    }

    if (parsedCashSpent > currentCash) {
        console.log("잔액이 부족합니다.");
        return;
    }

    const pulledPlayers = gacha(parsedCashSpent);
    currentCash -= parsedCashSpent;

    if (pulledPlayers.length > 0) {
        console.log("\n뽑은 선수들:");
        pulledPlayers.forEach((player, index) => {
            console.log(`${index + 1}. ${player.name} - 속력: ${player.speed}, 골 결정력: ${player.goalScoring}, 슛 파워: ${player.shotPower}, 수비: ${player.defense}, 스태미너: ${player.stamina}, 가치: ${format_value(player.value)}`);
        });
    }

    console.log(`남은 잔액: ${currentCash}`);
}

async function viewPulledPlayers() {
    if (pulled_players.length === 0) {
        console.log("아직 뽑은 선수가 없습니다.");
    } else {
        console.log("\n뽑은 선수 목록:");
        pulled_players.forEach((player, index) => {
            console.log(`${index + 1}. ${player.name} - 속력: ${player.speed}, 골 결정력: ${player.goalScoring}, 슛 파워: ${player.shotPower}, 수비: ${player.defense}, 스태미너: ${player.stamina}, 가치: ${format_value(player.value)}`);
        });
    }
}

async function mainMenu() {
    while (true) {
        console.log("\n1. 캐시 충전하기");
        console.log("2. 가챠 실행하기");
        console.log("3. 현재 잔액 확인하기");
        console.log("4. 뽑은 선수 목록 보기");
        console.log("5. 종료");
        
        const choice = await getUserInput("원하는 옵션을 선택하세요 (1-5): ");
        
        switch (choice) {
            case '1':
                await chargeCash();
                break;
            case '2':
                await performGacha();
                break;
            case '3':
                console.log(`현재 잔액: ${currentCash}`);
                break;
            case '4':
                await viewPulledPlayers();
                break;
            case '5':
                console.log("프로그램을 종료합니다.");
                rl.close();
                return;
            default:
                console.log("올바른 옵션을 선택해주세요.");
        }
    }
}

// 프로그램 시작
mainMenu();