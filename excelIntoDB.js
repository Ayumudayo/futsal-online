import xlsx from 'xlsx';
import prisma from './utils/prisma.js';

const workbook = xlsx.readFile('./player_list.xlsx'); // 엑셀 파일 읽기
const firstSheetName = workbook.SheetNames[0]; // 엑셀의 첫번째 시트 가져오기
const firstShee = workbook.Sheets[firstSheetName]; // 시트 데이터 가져오기
const firstSheeJson = xlsx.utils.sheet_to_json(firstShee); // 해당 내용을 JSON 파일로 변환

const excelPlayerId = firstSheeJson.map((item) => item['id']); // 엑셀에 있는 캐릭터 ID 모음

// DB 데이터를 가져온다.
const dbData = await prisma.player.findMany({
  select: {
    id: true,
    name: true,
    speed: true,
    goalScoring: true,
    shotPower: true,
    defense: true,
    stamina: true,
  },
});

// Player 테이블에 있는 캐릭터 ID 조회
const dbPlayerId = dbData.map((item) => item.id);

// 엑셀에 없는 캐릭터가 DB에는 있는지 확인
const deletePlayer = dbPlayerId.filter((player_id) => !excelPlayerId.includes(player_id));
// 있다면 DB에서 해당 캐릭터를 삭제
if (0 < deletePlayer.length) {
  console.log('삭제할 ID 목록: ' + deletePlayer.join(', '));
  await prisma.player.deleteMany({
    where: {
      id: { in: deletePlayer },
    },
  });
} else {
  console.log('삭제할 데이터가 없다.');
}

function isSamePlayer(player1, player2) {
  const key = ['speed', 'goalScoring', 'shotPower', 'defense', 'stamina'];
  return key.every((item) => player1[item] === player2[item]);
}

const dbDataMap = dbData.reduce((map, player) => {
  map[player.id] = player;
  return map;
}, {});

// 새로운 데이터를 DB에 삽입 / 데이터 변경
const promiseAll = [];
for(let i=0; i<firstSheeJson.length; i++) {
    // 인덱스 순서가 아닌 id 순서로 비교할 수 있도록
    const currentPlayer = firstSheeJson[i];
    const isPlayer = dbDataMap[currentPlayer['id']];
    if(isPlayer) {
        if (!isSamePlayer(currentPlayer, isPlayer)) {
            console.log(isPlayer['name'] + ' 변경!!!!');
            const promise = prisma.player.update({
                data: {
                    speed: currentPlayer['speed'],
                    goalScoring: currentPlayer['goalScoring'],
                    shotPower: currentPlayer['shotPower'],
                    defense: currentPlayer['defense'],
                    stamina: currentPlayer['stamina'],
                },
                where: {
                    id: currentPlayer['id']
                }
            });
            promiseAll.push(promise);
        }
    }
    else {
        console.log(currentPlayer['id'] + '삽입');
        const promise = prisma.player.create({
            data: {
                id: currentPlayer['id'],
                name: currentPlayer['name'],
                speed: currentPlayer['speed'],
                goalScoring: currentPlayer['goalScoring'],
                shotPower: currentPlayer['shotPower'],
                defense: currentPlayer['defense'],
                stamina: currentPlayer['stamina'],
            }
        });
        promiseAll.push(promise);
    }
}

const results = await Promise.allSettled(promiseAll);

// 각 Promise의 상태를 확인
results.forEach((result, index) => {
    if (result.status === "rejected") {
        console.log(`작업 ${index}: 실패`, result.reason);
    }
});
