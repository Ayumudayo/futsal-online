import xlsx from 'xlsx'
import prisma from './utils/prisma.js';

const workbook = xlsx.readFile('./player_list.xlsx');           // 엑셀 파일 읽기
const firstSheetName = workbook.SheetNames[0];                  // 엑셀의 첫번째 시트 가져오기
const firstShee = workbook.Sheets[firstSheetName];              // 시트 데이터 가져오기
const firstSheeJson = xlsx.utils.sheet_to_json(firstShee);     // 해당 내용을 JSON 파일로 변환

const excelPlayerId = firstSheeJson.map(item => item['id']);    // 엑셀에 있는 캐릭터 ID 모음

// Player 테이블에 있는 캐릭터 ID 조회
const playerId = await prisma.player.findMany({
    select: {
        id: true
    }
});
const dbPlayerId = playerId.map(item => item.id);

// 엑셀에 없는 캐릭터가 DB에는 있는지 확인
const deletePlayer = dbPlayerId.filter(player_id => !excelPlayerId.includes(player_id));
// 있다면 DB에서 해당 캐릭터를 삭제
if(0 < deletePlayer.length) {
    console.log('삭제할 ID 목록: ' + deletePlayer.join(', '));
    await prisma.player.deleteMany({
        where: {
            id: {
                in: deletePlayer
            }
        }
    });
}
else {
    console.log('삭제할 데이터가 없다.');
}

for(let i=0; i<firstSheeJson.length; i++) {
    const isPlayer = await prisma.player.findFirst({
        where: {
            id: firstSheeJson[i]['id']
        }
    })
    if(isPlayer) {
        console.log('이미 존재하는 데이터');
        continue;
    }

    await prisma.player.create({
        data: {
            id: firstSheeJson[i]['id'],
            name: firstSheeJson[i]['name'],
            speed: firstSheeJson[i]['speed'],
            goalScoring: firstSheeJson[i]['goalScoring'],
            shotPower: firstSheeJson[i]['shotPower'],
            defense: firstSheeJson[i]['defense'],
            stamina: firstSheeJson[i]['stamina'],
        }
    });
}